import { useCallback, useEffect, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  apiGetWordBankEntries,
  apiGetWordBankStats,
  apiCreateWordBankEntry,
  apiUpdateWordBankEntry,
  apiDeleteWordBankEntry,
  apiBatchDeleteWordBankEntries,
  apiRefreshWordBankCache,
} from '../lib/api';
import type { WordBankEntry, WordBankStats } from '../types';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'blacklist', label: 'Blacklist' },
  { value: 'core', label: 'Core Words' },
  { value: 'pos_default', label: 'POS Default' },
];

const CATEGORY_COLORS: Record<string, string> = {
  blacklist: 'bg-error/10 text-error border border-error/20',
  core: 'bg-success/10 text-success border border-success/20',
  pos_default: 'bg-warning/10 text-warning border border-warning/20',
};

export default function WordBankPage() {
  const [entries, setEntries] = useState<WordBankEntry[]>([]);
  const [stats, setStats] = useState<WordBankStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [hasMore, setHasMore] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WordBankEntry | null>(null);
  const [formWord, setFormWord] = useState('');
  const [formCategory, setFormCategory] = useState('pos_default');
  const [formPosTag, setFormPosTag] = useState('');
  const [formScore, setFormScore] = useState(5);
  const [formNotes, setFormNotes] = useState('');

  // Batch delete
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const loadEntries = useCallback(async (cat = category, s = search, off = offset) => {
    setLoading(true);
    try {
      const data = await apiGetWordBankEntries(cat, s, off, limit + 1);
      setHasMore(data.length > limit);
      setEntries(data.slice(0, limit));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [category, search, offset, limit]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGetWordBankStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { loadEntries(); loadStats(); }, [loadEntries, loadStats]);

  const resetForm = () => {
    setEditEntry(null);
    setFormWord('');
    setFormCategory('pos_default');
    setFormPosTag('');
    setFormScore(5);
    setFormNotes('');
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (entry: WordBankEntry) => {
    setEditEntry(entry);
    setFormWord(entry.word);
    setFormCategory(entry.category);
    setFormPosTag(entry.posTag || '');
    setFormScore(entry.baseScore);
    setFormNotes(entry.notes || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formWord.trim()) return;
    try {
      if (editEntry) {
        await apiUpdateWordBankEntry(editEntry.id, {
          word: formWord.toLowerCase().trim(),
          category: formCategory,
          posTag: formPosTag || null,
          baseScore: formScore,
          notes: formNotes || null,
        });
      } else {
        await apiCreateWordBankEntry({
          word: formWord.toLowerCase().trim(),
          category: formCategory,
          posTag: formPosTag || null,
          baseScore: formScore,
          notes: formNotes || null,
        });
      }
      setModalOpen(false);
      resetForm();
      loadEntries();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteWordBankEntry(id);
      setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
      loadEntries();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    try {
      await apiBatchDeleteWordBankEntries(Array.from(selected));
      setSelected(new Set());
      loadEntries();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiRefreshWordBankCache();
      loadEntries();
      loadStats();
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map(e => e.id)));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Word Bank Manager</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="secondary" size="sm">
            {refreshing ? 'Refreshing...' : 'Refresh Cache'}
          </Button>
          <Button onClick={openCreate} variant="primary" size="sm">
            + Add Word
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Blacklist', value: stats.blacklist, color: 'text-error' },
            { label: 'Core Words', value: stats.core, color: 'text-success' },
            { label: 'POS Default', value: stats.pos_default, color: 'text-warning' },
            { label: 'Total', value: stats.total, color: 'text-primary' },
          ].map(s => (
            <Card key={s.label} className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setOffset(0); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  category === c.value
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:text-text'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') loadEntries(category, search, 0); }}
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          <Button onClick={() => loadEntries(category, search, 0)} variant="ghost" size="sm">
            Search
          </Button>
        </div>
      </Card>

      {/* Batch actions */}
      {selected.size > 0 && (
        <Card className="flex items-center gap-3 p-3 bg-primary-surface/50">
          <span className="text-sm text-primary">{selected.size} selected</span>
          <Button onClick={handleBatchDelete} variant="danger" size="sm">
            Delete Selected
          </Button>
          <Button onClick={() => setSelected(new Set())} variant="ghost" size="sm">
            Clear
          </Button>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-bg-alt/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === entries.length && entries.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Word</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Category</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Score</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">POS Tag</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Notes</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-secondary">No entries found.</td></tr>
              ) : (
                entries.map(entry => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 hover:bg-bg-alt/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-text">{entry.word}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[entry.category] || 'bg-bg-alt text-text-secondary'}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text">{entry.baseScore}</td>
                    <td className="px-4 py-3 text-text-secondary">{entry.posTag || '—'}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-text-secondary">{entry.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button onClick={() => openEdit(entry)} variant="ghost" size="sm">Edit</Button>
                        <Button onClick={() => handleDelete(entry.id)} variant="danger" size="sm">Del</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && entries.length > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-bg-alt/30 px-4 py-3">
            <span className="text-xs text-text-secondary">
              Showing {entries.length} entries (offset: {offset})
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                variant="secondary"
                size="sm"
              >
                Prev
              </Button>
              <Button
                onClick={() => { setOffset(offset + limit); loadEntries(category, search, offset + limit); }}
                disabled={!hasMore}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setModalOpen(false); resetForm(); }}>
          <Card className="mx-4 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-text">
              {editEntry ? 'Edit Word' : 'Add Word'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Word *</label>
                <input
                  type="text"
                  value={formWord}
                  onChange={(e) => setFormWord(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="blacklist">Blacklist</option>
                  <option value="core">Core Words</option>
                  <option value="pos_default">POS Default</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">POS Tag</label>
                  <input
                    type="text"
                    value={formPosTag}
                    onChange={(e) => setFormPosTag(e.target.value)}
                    placeholder="e.g. NN, JJ"
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text">Base Score</label>
                  <input
                    type="number"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">Notes</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => { setModalOpen(false); resetForm(); }} variant="secondary">Cancel</Button>
                <Button onClick={handleSave} variant="primary">{editEntry ? 'Update' : 'Create'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
