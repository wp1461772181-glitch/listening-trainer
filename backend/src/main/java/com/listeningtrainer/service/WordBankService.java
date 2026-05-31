package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.listeningtrainer.dto.WordBankEntryDTO;
import com.listeningtrainer.dto.WordBankEntryRequest;
import com.listeningtrainer.entity.WordBankEntry;
import com.listeningtrainer.mapper.WordBankEntryMapper;
import org.springframework.boot.*;
import org.springframework.stereotype.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

/**
 * Manages the word bank: loads entries from DB into memory cache,
 * provides scoring for blank selection, and CRUD operations.
 */
@Service
public class WordBankService implements ApplicationRunner {

    private final WordBankEntryMapper mapper;

    // In-memory cache: lowercase word -> entry
    private final ConcurrentHashMap<String, WordBankEntryDTO> cache = new ConcurrentHashMap<>();

    public WordBankService(WordBankEntryMapper mapper) {
        this.mapper = mapper;
    }

    // === ApplicationRunner: seed data on first startup ===

    @Override
    public void run(ApplicationArguments args) {
        if (mapper.selectCount(null) == 0) {
            seedFromDefaults();
        }
        refreshFromDb();
    }

    private void seedFromDefaults() {
        List<WordBankEntry> entries = new ArrayList<>();
        Instant now = Instant.now();

        for (String w : DEFAULT_BLACKLIST) {
            WordBankEntry e = new WordBankEntry();
            e.setWord(w); e.setCategory("blacklist"); e.setBaseScore(0);
            e.setNotes("Blacklisted: skip"); e.setCreatedAt(now); e.setUpdatedAt(now);
            entries.add(e);
        }
        for (String w : DEFAULT_CORE) {
            WordBankEntry e = new WordBankEntry();
            e.setWord(w); e.setCategory("core"); e.setBaseScore(100);
            e.setNotes("Core answer word"); e.setCreatedAt(now); e.setUpdatedAt(now);
            entries.add(e);
        }

        // Batch insert in chunks of 100
        for (int i = 0; i < entries.size(); i += 100) {
            int end = Math.min(i + 100, entries.size());
            for (WordBankEntry e : entries.subList(i, end)) {
                mapper.insert(e);
            }
        }
    }

    // === Cache management ===

    public void refreshFromDb() {
        cache.clear();
        List<WordBankEntry> all = mapper.selectList(null);
        for (WordBankEntry e : all) {
            cache.put(e.getWord().toLowerCase(), WordBankEntryDTO.fromEntity(e));
        }
    }

    // === Scoring (replacement for old hardcoded WordBank.java) ===

    public int scoreWord(String word, String posTag) {
        String lower = word.toLowerCase();

        // Filter out pure numbers, punctuation, ellipsis
        if (lower.matches("[\\d.,$%]+") || lower.equals("...") ||
            lower.matches("[a-zA-Z]*[-]{2,}[a-zA-Z]*")) return 0;

        WordBankEntryDTO entry = cache.get(lower);

        if (entry == null) {
            // Not in word bank: default by POS
            return defaultPosScore(posTag);
        }

        if ("blacklist".equals(entry.getCategory())) return 0;
        if ("core".equals(entry.getCategory())) return 100;

        // pos_default or custom category
        int score = entry.getBaseScore() != null ? entry.getBaseScore() : defaultPosScore(posTag);

        // Length bonus
        if (word.length() >= 6) score += 3;

        // Morphology bonuses
        if (lower.startsWith("un") || lower.startsWith("in") || lower.startsWith("dis")) score += 2;
        if (lower.endsWith("ful") || lower.endsWith("less") || lower.endsWith("tion")) score += 2;

        return score;
    }

    private int defaultPosScore(String posTag) {
        if (posTag == null || posTag.isEmpty()) return 5;
        if (posTag.startsWith("NN")) return posTag.startsWith("NNP") ? 20 : 15;
        if (posTag.startsWith("JJ")) return 10;
        if (posTag.startsWith("RB")) return 7;
        if (posTag.startsWith("VB")) return 5;
        return 5;
    }

    // === CRUD ===

    public List<WordBankEntryDTO> listEntries(String category, String search, int offset, int limit) {
        LambdaQueryWrapper<WordBankEntry> qw = new LambdaQueryWrapper<>();
        if (category != null && !category.isEmpty() && !"all".equals(category)) {
            qw.eq(WordBankEntry::getCategory, category);
        }
        if (search != null && !search.isEmpty()) {
            qw.like(WordBankEntry::getWord, search.toLowerCase());
        }
        qw.orderByAsc(WordBankEntry::getWord);
        qw.last("LIMIT " + limit + " OFFSET " + offset);

        return mapper.selectList(qw).stream()
            .map(WordBankEntryDTO::fromEntity)
            .collect(Collectors.toList());
    }

    public long countEntries(String category) {
        LambdaQueryWrapper<WordBankEntry> qw = new LambdaQueryWrapper<>();
        if (category != null && !category.isEmpty() && !"all".equals(category)) {
            qw.eq(WordBankEntry::getCategory, category);
        }
        return mapper.selectCount(qw);
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("blacklist", countEntries("blacklist"));
        stats.put("core", countEntries("core"));
        stats.put("pos_default", countEntries("pos_default"));
        stats.put("total", countEntries(null));
        return stats;
    }

    public WordBankEntryDTO createEntry(WordBankEntryRequest req) {
        WordBankEntry e = new WordBankEntry();
        e.setWord(req.getWord().toLowerCase());
        e.setCategory(req.getCategory() != null ? req.getCategory() : "pos_default");
        e.setPosTag(req.getPosTag());
        e.setBaseScore(req.getBaseScore() != null ? req.getBaseScore() : 5);
        e.setNotes(req.getNotes());
        e.setCreatedAt(Instant.now());
        e.setUpdatedAt(Instant.now());
        mapper.insert(e);
        WordBankEntryDTO dto = WordBankEntryDTO.fromEntity(e);
        cache.put(e.getWord(), dto);
        return dto;
    }

    public WordBankEntryDTO updateEntry(Long id, WordBankEntryRequest req) {
        WordBankEntry e = mapper.selectById(id);
        if (e == null) return null;
        if (req.getWord() != null) e.setWord(req.getWord().toLowerCase());
        if (req.getCategory() != null) e.setCategory(req.getCategory());
        if (req.getPosTag() != null) e.setPosTag(req.getPosTag());
        if (req.getBaseScore() != null) e.setBaseScore(req.getBaseScore());
        if (req.getNotes() != null) e.setNotes(req.getNotes());
        e.setUpdatedAt(Instant.now());
        mapper.updateById(e);
        WordBankEntryDTO dto = WordBankEntryDTO.fromEntity(e);
        cache.put(e.getWord(), dto);
        return dto;
    }

    public boolean deleteEntry(Long id) {
        WordBankEntry e = mapper.selectById(id);
        if (e == null) return false;
        mapper.deleteById(id);
        cache.remove(e.getWord().toLowerCase());
        return true;
    }

    public int batchDelete(List<Long> ids) {
        int count = 0;
        for (Long id : ids) {
            WordBankEntry e = mapper.selectById(id);
            if (e != null) {
                cache.remove(e.getWord().toLowerCase());
                mapper.deleteById(id);
                count++;
            }
        }
        return count;
    }

    // === Default word lists (used for seeding only) ===

    private static final Set<String> DEFAULT_BLACKLIST = Set.of(
        "have","has","had","do","does","did","get","got","make","made","take","took","give","gave","go","went","come","came","like","want","need","know","think","say","see","feel","said","tell","told","put","set","let","keep","kept","held","hold","bring","brought","try","tried","ask","asked","use","used","find","found","work","worked","call","called","help","helped","move","moved","show","shown","turn","turned","play","played","look","looked","talk","talked","start","started","starts","run","ran","hope","hoped","believe","believed","happen","happened","change","changed","prefer","preferred","hear","heard","listen","listened","read","wrote","write","eat","ate","sleep","slept","wake","woke","pick","picked","fill","filled","speak","spoke","spoken","choose","chose","chosen","decide","decided","consider","considered","provide","provided","offer","offered","send","sent","receive","received","pay","paid","buy","bought","sell","sold","spend","spent","cost","save","allow","allowed","join","joined","enter","entered","leave","left","reach","arrived","meet","met","include","included",
        "i","you","he","she","it","we","they","them","me","him","her","us","my","your","his","its","our","their","mine","yours","hers","ours","theirs","myself","yourself","himself","herself","itself","ourselves","themselves","someone","somebody","anyone","anybody","everyone","everybody","nobody","nothing","something","anything","everything",
        "the","a","an","this","that","these","those","some","any","no","each","every","both","few","many","much","more","most","such","own","same","other","another","all","half",
        "in","on","at","to","for","of","from","with","by","about","up","out","over","under","into","through","after","before","between","during","around","near","off","until","since","without","within","against","along","across","towards","down","above","below",
        "and","but","or","so","because","if","when","where","while","although","though","however","whether","than","unless",
        "now","yes","not","very","too","just","also","only","even","still","already","quite","really","well","back","here","there","never","always","sometimes","often","usually","probably","maybe","perhaps","enough","almost","fine","good","bad","great","nice","right","wrong","best","worst","better","old","new","young","big","small","long","short","fast","slow","high","low","hard","soft",
        "is","am","are","was","were","be","been","being","can","could","will","would","shall","should","may","might","must",
        "oh","mm","erm","um","okay",
        "who","what","which","whose","whom","why","how",
        "one","two","three","four","five","six","zero",
        "'s","'re","'ll","'ve","'d","'m","n't","...","uh","ah"
    );

    private static final Set<String> DEFAULT_CORE = Set.of(
        "library","gym","campus","station","park","museum","restaurant","airport","hotel","hospital","cinema","theatre","stadium","factory","garden","market","cafe","laboratory","gallery","pool","harbour","supermarket","office","studio","warehouse",
        "monday","tuesday","wednesday","thursday","friday","saturday","sunday","january","february","march","april","june","july","august","september","october","november","december","morning","weekend","evening","afternoon","midnight","tomorrow","yesterday","fortnight","semester","vacation","holiday",
        "seven","eight","nine","ten","eleven","twelve","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety","hundred","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth",
        "routine","schedule","exercise","breakfast","dinner","lunch","bedroom","kitchen","bathroom","furniture","television","computer","telephone","refrigerator","washing","machine","apartment","balcony","ceiling","curtain","blanket","pillow","wardrobe","drawer",
        "lecture","assignment","seminar","tutor","exam","essay","dissertation","research","presentation","deadline","tuition","scholarship","notebook","textbook","bibliography",
        "ticket","luggage","passport","flight","journey","booking","reservation","departure","arrival","destination","itinerary","accommodation","visa","currency","embassy","tourist","souvenir",
        "important","convenient","enjoyable","comfortable","excellent","terrible","difficult","expensive","reasonable","sufficient","adequate","compulsory","optional","maximum","minimum","previous","original","temporary","permanent","regular","flexible"
    );
}
