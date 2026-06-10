const blacklist = [
  'have','has','had','do','does','did','get','got','make','made','take','took','give','gave','go','went','come','came','like','want','need','know','think','say','see','feel','said','tell','told','put','set','let','keep','kept','held','hold','bring','brought','try','tried','ask','asked','use','used','find','found','work','worked','call','called','help','helped','move','moved','show','shown','turn','turned','play','played','look','looked','talk','talked','start','started','starts','run','ran','hope','hoped','believe','believed','happen','happened','change','changed','prefer','preferred','hear','heard','listen','listened','read','wrote','write','eat','ate','sleep','slept','wake','woke','pick','picked','fill','filled','speak','spoke','spoken','choose','chose','chosen','decide','decided','consider','considered','provide','provided','offer','offered','send','sent','receive','received','pay','paid','buy','bought','sell','sold','spend','spent','cost','save','allow','allowed','join','joined','enter','entered','leave','left','reach','arrived','meet','met','include','included',
  'i','you','he','she','it','we','they','them','me','him','her','us','my','your','his','its','our','their','mine','yours','hers','ours','theirs','myself','yourself','himself','herself','itself','ourselves','themselves','someone','somebody','anyone','anybody','everyone','everybody','nobody','nothing','something','anything','everything',
  'the','a','an','this','that','these','those','some','any','no','each','every','both','few','many','much','more','most','such','own','same','other','another','all','half',
  'in','on','at','to','for','of','from','with','by','about','up','out','over','under','into','through','after','before','between','during','around','near','off','until','since','without','within','against','along','across','towards','down','above','below',
  'and','but','or','so','because','if','when','where','while','although','though','however','whether','than','unless',
  'now','yes','not','very','too','just','also','only','even','still','already','quite','really','well','back','here','there','never','always','sometimes','often','usually','probably','maybe','perhaps','enough','almost','fine','good','bad','great','nice','right','wrong','best','worst','better','old','new','young','big','small','long','short','fast','slow','high','low','hard','soft',
  'is','am','are','was','were','be','been','being','can','could','will','would','shall','should','may','might','must',
  'oh','mm','erm','um','okay',
  'who','what','which','whose','whom','why','how',
  'one','two','three','four','five','six','zero',
  "'s","'re","'ll","'ve","'d","'m","n't",'...','uh','ah'
];

const core = [
  'library','gym','campus','station','park','museum','restaurant','airport','hotel','hospital','cinema','theatre','stadium','factory','garden','market','cafe','laboratory','gallery','pool','harbour','supermarket','office','studio','warehouse',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday','january','february','march','april','june','july','august','september','october','november','december','morning','weekend','evening','afternoon','midnight','tomorrow','yesterday','fortnight','semester','vacation','holiday',
  'seven','eight','nine','ten','eleven','twelve','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth',
  'routine','schedule','exercise','breakfast','dinner','lunch','bedroom','kitchen','bathroom','furniture','television','computer','telephone','refrigerator','washing','machine','apartment','balcony','ceiling','curtain','blanket','pillow','wardrobe','drawer',
  'lecture','assignment','seminar','tutor','exam','essay','dissertation','research','presentation','deadline','tuition','scholarship','notebook','textbook','bibliography',
  'ticket','luggage','passport','flight','journey','booking','reservation','departure','arrival','destination','itinerary','accommodation','visa','currency','embassy','tourist','souvenir',
  'important','convenient','enjoyable','comfortable','excellent','terrible','difficult','expensive','reasonable','sufficient','adequate','compulsory','optional','maximum','minimum','previous','original','temporary','permanent','regular','flexible'
];

function esc(w) { return w.replace(/'/g, "''"); }

const sql = [];
for (const w of blacklist) {
  sql.push(`INSERT INTO word_bank_entry (word, category, base_score, notes) VALUES ('${esc(w)}', 'blacklist', 0, 'Blacklisted: skip') ON DUPLICATE KEY UPDATE category='blacklist', base_score=0;`);
}
for (const w of core) {
  sql.push(`INSERT INTO word_bank_entry (word, category, base_score, notes) VALUES ('${esc(w)}', 'core', 100, 'Core answer word') ON DUPLICATE KEY UPDATE category='core', base_score=100;`);
}

console.log(sql.join('\n'));
console.log(`\n-- Total: ${blacklist.length + core.length} entries (${blacklist.length} blacklist, ${core.length} core)`);
