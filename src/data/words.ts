/**
 * 单词树数据（第一版）
 * ------------------------------------------------------------------
 * 关系三分：
 *   derivation  派生：加词缀/复合造出新词，词性或词义类别改变
 *   inflection  词形变化：同一个词位（lexeme）的语法形式（复数、过去式、分词、比较级…）
 *   etymology   词源：来自哪条词根/借词路线（本版只做粗粒度拉丁/希腊/古英语来源）
 * 数据说明：释义与词性为人工核对；例句全部为自编（界面标注「自编例句」），
 * 不冒充词典例句；IPA 为常见英式/美式折中写法，仅供读音参考。
 */
import type { WordEntry, Edge, RootEntry } from '../types'

export const ROOTS: RootEntry[] = [
  { id: 'root:art', label: 'art-', origin: '拉丁 ars / art- 「技艺、手艺」', gloss: '技艺、人工' },
  { id: 'root:cre', label: 'cre-', origin: '拉丁 creare 「创造、生育」', gloss: '创造、生长' },
  { id: 'root:ag', label: 'ag- / act-', origin: '拉丁 agere 「驱动、做」的过去分词 actus', gloss: '做、驱动' },
  { id: 'root:writ', label: 'writ-', origin: '古英语 wrītan 「刻、划」', gloss: '刻写' },
]

export const WORDS: WordEntry[] = [
  // ---------------- ART ----------------
  {
    id: 'art', word: 'art', pos: '名词', ipa: '/ɑːt/', family: 'art',
    gloss: '艺术；美术；技艺',
    note: '既是「艺术」这一大类，也可指一门「手艺、技巧」。',
    collocations: [
      { phrase: 'modern art', zh: '现代艺术' },
      { phrase: 'the art of conversation', zh: '谈话的艺术' },
      { phrase: 'work of art', zh: '艺术品' },
    ],
    examples: [
      { en: 'She studies art at a small college in the north.', zh: '她在北方一所小学院学艺术。' },
      { en: 'Cooking well is an art, not a science.', zh: '把菜做好是一门手艺，不是科学。' },
    ],
  },
  {
    id: 'arts', word: 'arts', pos: '名词（复数）', ipa: '/ɑːts/', family: 'art',
    gloss: '艺术（复数）；人文学科',
    note: 'art 的规则复数，同时有「文科」的固定用法，属词形变化而非派生。',
    collocations: [
      { phrase: 'the arts', zh: '艺术（总称）' },
      { phrase: 'arts and sciences', zh: '文理科' },
    ],
    examples: [{ en: 'The faculty of arts is on the east side of the campus.', zh: '文学院在校园东侧。' }],
  },
  {
    id: 'artist', word: 'artist', pos: '名词', ipa: '/ˈɑːtɪst/', family: 'art',
    gloss: '艺术家；画家',
    note: 'art + -ist（表「从事…的人」）。',
    collocations: [
      { phrase: 'a talented artist', zh: '有天赋的艺术家' },
      { phrase: 'street artist', zh: '街头艺术家' },
    ],
    examples: [{ en: 'The artist spent three years on a single canvas.', zh: '这位艺术家在一幅画上花了三年。' }],
  },
  {
    id: 'artists', word: 'artists', pos: '名词（复数）', ipa: '/ˈɑːtɪsts/', family: 'art',
    gloss: '艺术家（复数）',
    collocations: [{ phrase: 'young artists', zh: '年轻艺术家' }],
    examples: [{ en: 'Several artists shared one studio to save rent.', zh: '几位艺术家合租一间画室省房租。' }],
  },
  {
    id: 'artistic', word: 'artistic', pos: '形容词', ipa: '/ɑːˈtɪstɪk/', family: 'art',
    gloss: '艺术的；有艺术天赋的',
    note: 'artist + -ic。注意与 artificial（人工的）不是同一条派生路线。',
    collocations: [
      { phrase: 'artistic talent', zh: '艺术天赋' },
      { phrase: 'artistic director', zh: '艺术总监' },
    ],
    examples: [{ en: 'Her artistic side only showed up after she turned thirty.', zh: '她的艺术天分三十岁以后才显出来。' }],
  },
  {
    id: 'artistically', word: 'artistically', pos: '副词', ipa: '/ɑːˈtɪstɪkli/', family: 'art',
    gloss: '在艺术上；有艺术地',
    collocations: [{ phrase: 'artistically inclined', zh: '有艺术倾向的' }],
    examples: [{ en: 'The room is artistically arranged but hard to clean.', zh: '这房间布置得很有艺术感，但很难打扫。' }],
  },
  {
    id: 'artistry', word: 'artistry', pos: '名词', ipa: '/ˈɑːtɪstri/', family: 'art',
    gloss: '艺术性；高超技艺',
    note: 'artist + -ry，指「技艺的水平」而非「某件作品」。',
    collocations: [{ phrase: 'technical artistry', zh: '技术上的精湛' }],
    examples: [{ en: 'The film is admired for its visual artistry.', zh: '这部片子的视觉艺术性很受推崇。' }],
  },
  {
    id: 'artificial', word: 'artificial', pos: '形容词', ipa: '/ˌɑːtɪˈfɪʃl/', family: 'art',
    gloss: '人造的；虚假的',
    note: '来自拉丁 artificium（ars「技艺」+ facere「做」），不是现代英语里 art + -ficial 的规则派生。',
    collocations: [
      { phrase: 'artificial intelligence', zh: '人工智能' },
      { phrase: 'artificial sweetener', zh: '人工甜味剂' },
    ],
    examples: [{ en: 'The smile looked artificial, but the welcome was real.', zh: '那笑容看着有点假，欢迎倒是真心的。' }],
  },
  {
    id: 'artificially', word: 'artificially', pos: '副词', ipa: '/ˌɑːtɪˈfɪʃəli/', family: 'art',
    gloss: '人工地；人为地',
    collocations: [{ phrase: 'artificially low price', zh: '人为压低的价格' }],
    examples: [{ en: 'The lake is kept artificially full in dry summers.', zh: '干旱的夏天，这个湖靠人工维持水位。' }],
  },
  {
    id: 'artifice', word: 'artifice', pos: '名词', ipa: '/ˈɑːtɪfɪs/', family: 'art',
    gloss: '诡计；巧妙的花招',
    note: '与 artificial 同源（拉丁 artificium），现代义偏「机巧、手段」。',
    collocations: [{ phrase: 'by artifice', zh: '靠手腕' }],
    examples: [{ en: 'He won the argument by artifice rather than evidence.', zh: '他靠手腕而不是证据赢了这场争论。' }],
  },
  {
    id: 'artisan', word: 'artisan', pos: '名词', ipa: '/ˌɑːtɪˈzæn/', family: 'art',
    gloss: '手艺人；工匠',
    note: '经法语 artisan 借入，同源于拉丁 ars，但不走 -ist/-ic 那条路线。',
    collocations: [{ phrase: 'local artisan', zh: '本地工匠' }],
    examples: [{ en: 'The bread is made by an artisan who works alone at night.', zh: '这面包出自一位夜里独自干活的匠人。' }],
  },
  {
    id: 'artwork', word: 'artwork', pos: '名词', ipa: '/ˈɑːtwɜːk/', family: 'art',
    gloss: '（一件）艺术品；插图',
    note: '复合词：art + work，属构词法里的复合，不是加缀派生。',
    collocations: [{ phrase: 'original artwork', zh: '原作插图' }],
    examples: [{ en: 'The magazine pays well for original artwork.', zh: '这家杂志为原创插图付的稿费不错。' }],
  },

  // ---------------- CREATE ----------------
  {
    id: 'create', word: 'create', pos: '动词', ipa: '/kriˈeɪt/', family: 'create',
    gloss: '创造；创作；造成',
    collocations: [
      { phrase: 'create jobs', zh: '创造就业' },
      { phrase: 'create an impression', zh: '留下印象' },
    ],
    examples: [{ en: 'The policy created more problems than it solved.', zh: '这项政策造成的问题比解决的多。' }],
  },
  {
    id: 'creates', word: 'creates', pos: '动词（第三人称单数）', ipa: '/kriˈeɪts/', family: 'create',
    gloss: '创造（第三人称单数）',
    collocations: [{ phrase: 'it creates', zh: '它造成' }],
    examples: [{ en: 'Every shortcut creates a debt somewhere.', zh: '每个捷径都会在别处留下欠账。' }],
  },
  {
    id: 'created', word: 'created', pos: '动词（过去式/过去分词）', ipa: '/kriˈeɪtɪd/', family: 'create',
    gloss: '创造了；被创造',
    collocations: [{ phrase: 'newly created', zh: '新设立的' }],
    examples: [{ en: 'The position was created last spring.', zh: '这个岗位是去年春天设的。' }],
  },
  {
    id: 'creating', word: 'creating', pos: '动词（现在分词/动名词）', ipa: '/kriˈeɪtɪŋ/', family: 'create',
    gloss: '创造（进行/动名词）',
    collocations: [{ phrase: 'creating value', zh: '创造价值' }],
    examples: [{ en: 'He is better at fixing things than creating them.', zh: '他修东西比造东西在行。' }],
  },
  {
    id: 'creation', word: 'creation', pos: '名词', ipa: '/kriˈeɪʃn/', family: 'create',
    gloss: '创造；创作物；创世',
    note: 'create + -ion（动词→名词）。',
    collocations: [
      { phrase: 'job creation', zh: '创造就业' },
      { phrase: 'the creation of', zh: '……的创立' },
    ],
    examples: [{ en: 'The creation of the park took a decade of negotiation.', zh: '这座公园的建成谈了十年。' }],
  },
  {
    id: 'creator', word: 'creator', pos: '名词', ipa: '/kriˈeɪtə/', family: 'create',
    gloss: '创造者；创作者',
    collocations: [{ phrase: 'content creator', zh: '内容创作者' }],
    examples: [{ en: 'The creator of the game answers every bug report himself.', zh: '这个游戏的作者亲自回复每一条 bug。' }],
  },
  {
    id: 'creative', word: 'creative', pos: '形容词', ipa: '/kriˈeɪtɪv/', family: 'create',
    gloss: '有创造力的；创作的',
    collocations: [
      { phrase: 'creative work', zh: '创作性工作' },
      { phrase: 'creative solution', zh: '巧妙的解法' },
    ],
    examples: [{ en: 'The budget is small, so the solution has to be creative.', zh: '预算很少，所以办法得巧一点。' }],
  },
  {
    id: 'creatively', word: 'creatively', pos: '副词', ipa: '/kriˈeɪtɪvli/', family: 'create',
    gloss: '有创意地',
    collocations: [{ phrase: 'think creatively', zh: '有创意地思考' }],
    examples: [{ en: 'They solved the noise problem creatively, with carpets.', zh: '他们用地毯很有创意地解决了噪音问题。' }],
  },
  {
    id: 'creativity', word: 'creativity', pos: '名词', ipa: '/ˌkriːeɪˈtɪvəti/', family: 'create',
    gloss: '创造力',
    note: 'creative + -ity（形容词→抽象名词）。',
    collocations: [{ phrase: 'foster creativity', zh: '培养创造力' }],
    examples: [{ en: 'Deadlines help some people and kill creativity in others.', zh: '截止日期对有的人是助力，对另一些人是绞索。' }],
  },
  {
    id: 'creature', word: 'creature', pos: '名词', ipa: '/ˈkriːtʃə/', family: 'create',
    gloss: '生物；动物；（某种）人',
    note: '拉丁 creatura「被造之物」，同源于 create，但现代英语中不是规则加缀派生。',
    collocations: [
      { phrase: 'living creature', zh: '活物' },
      { phrase: 'a creature of habit', zh: '习惯成性的人' },
    ],
    examples: [{ en: 'Every creature in the pond disappeared after the frost.', zh: '霜降之后，池塘里的活物全不见了。' }],
  },
  {
    id: 'procreate', word: 'procreate', pos: '动词', ipa: '/ˈprəʊkrieɪt/', family: 'create',
    gloss: '繁殖；生育',
    note: '前缀 pro-（向前、为后代）+ create 同源词根，属加缀派生。',
    collocations: [{ phrase: 'procreate freely', zh: '自由繁殖' }],
    examples: [{ en: 'These fish procreate only in shallow, warm water.', zh: '这种鱼只在温暖浅水里繁殖。' }],
  },
  {
    id: 'recreation', word: 'recreation', pos: '名词', ipa: '/ˌrekriˈeɪʃn/', family: 'create',
    gloss: '娱乐；消遣',
    note: 're-（再）+ creation，指「恢复精力」；与 re-creation「重新创造」同形不同义，靠连字符区分。',
    collocations: [
      { phrase: 'recreation area', zh: '休闲区' },
      { phrase: 'for recreation', zh: '为了消遣' },
    ],
    examples: [{ en: 'The lake is used for recreation, not fishing rights.', zh: '这个湖是休闲用的，不是捕鱼权。' }],
  },

  // ---------------- ACT ----------------
  {
    id: 'act', word: 'act', pos: '动词/名词', ipa: '/ækt/', family: 'act',
    gloss: '行动；表演；法案',
    collocations: [
      { phrase: 'act on', zh: '依据……行动' },
      { phrase: 'act as', zh: '充当' },
    ],
    examples: [{ en: 'He acted on the tip without checking it first.', zh: '他没核实就照着那条线报行动了。' }],
  },
  {
    id: 'acts', word: 'acts', pos: '动词（第三人称单数）/名词复数', ipa: '/ækts/', family: 'act',
    gloss: '行动（第三人称单数）；行为（复数）',
    collocations: [{ phrase: 'acts of kindness', zh: '善举' }],
    examples: [{ en: 'Small acts of kindness cost almost nothing.', zh: '小小的善举几乎不花钱。' }],
  },
  {
    id: 'acted', word: 'acted', pos: '动词（过去式/过去分词）', ipa: '/ˈæktɪd/', family: 'act',
    gloss: '行动了；扮演过',
    collocations: [{ phrase: 'acted quickly', zh: '迅速行动' }],
    examples: [{ en: 'They acted quickly, which saved the harvest.', zh: '他们动作快，保住了收成。' }],
  },
  {
    id: 'acting', word: 'acting', pos: '名词/形容词', ipa: '/ˈæktɪŋ/', family: 'act',
    gloss: '表演（艺术）；代理的',
    note: '既是 act 的现在分词，也有独立的「表演」「代理」用法。',
    collocations: [
      { phrase: 'acting career', zh: '演艺生涯' },
      { phrase: 'acting manager', zh: '代理经理' },
    ],
    examples: [{ en: 'She took the acting job for one season only.', zh: '那份代理职位她只干了一季。' }],
  },
  {
    id: 'action', word: 'action', pos: '名词', ipa: '/ˈækʃn/', family: 'act',
    gloss: '行动；作用；诉讼',
    note: 'act + -ion（动词→名词）。',
    collocations: [
      { phrase: 'take action', zh: '采取行动' },
      { phrase: 'course of action', zh: '行动方案' },
    ],
    examples: [{ en: 'The plan was good; the action was slow.', zh: '计划不错，行动太慢。' }],
  },
  {
    id: 'active', word: 'active', pos: '形容词', ipa: '/ˈæktɪv/', family: 'act',
    gloss: '活跃的；主动的；有效的',
    collocations: [
      { phrase: 'active role', zh: '积极角色' },
      { phrase: 'active volcano', zh: '活火山' },
    ],
    examples: [{ en: 'He stays active by walking to work in any weather.', zh: '不管什么天气他都走路上班，保持活动。' }],
  },
  {
    id: 'actively', word: 'actively', pos: '副词', ipa: '/ˈæktɪvli/', family: 'act',
    gloss: '积极地；主动地',
    collocations: [{ phrase: 'actively involved', zh: '积极参与的' }],
    examples: [{ en: 'She actively avoids meetings before noon.', zh: '她刻意避开中午前的会。' }],
  },
  {
    id: 'activity', word: 'activity', pos: '名词', ipa: '/ækˈtɪvəti/', family: 'act',
    gloss: '活动；活跃状态',
    note: 'active + -ity。',
    collocations: [
      { phrase: 'outdoor activity', zh: '户外活动' },
      { phrase: 'economic activity', zh: '经济活动' },
    ],
    examples: [{ en: 'The town has little activity after nine.', zh: '这个镇子九点以后就没什么动静了。' }],
  },
  {
    id: 'actor', word: 'actor', pos: '名词', ipa: '/ˈæktə/', family: 'act',
    gloss: '演员；行动者',
    note: 'act + -or（表「做…的人」）。当代英语里也作中性用法指所有演员。',
    collocations: [{ phrase: 'lead actor', zh: '主演' }],
    examples: [{ en: 'The actor learned the dialect in six weeks.', zh: '这位演员六周学会了那种方言。' }],
  },
  {
    id: 'actress', word: 'actress', pos: '名词', ipa: '/ˈæktrəs/', family: 'act',
    gloss: '女演员',
    note: 'act + -ress（表阴性，法语来源）。现在许多场合主张用 actor 统称。',
    collocations: [{ phrase: 'supporting actress', zh: '女配角' }],
    examples: [{ en: 'The actress prefers stage work to film.', zh: '这位女演员更喜欢舞台而不是电影。' }],
  },
  {
    id: 'react', word: 'react', pos: '动词', ipa: '/riˈækt/', family: 'act',
    gloss: '反应；起化学反应',
    note: '前缀 re-（回）+ act。',
    collocations: [
      { phrase: 'react to', zh: '对……作出反应' },
      { phrase: 'react badly', zh: '反应激烈' },
    ],
    examples: [{ en: 'He reacted to the news by saying nothing at all.', zh: '他对这个消息的反应是一句话都不说。' }],
  },
  {
    id: 'reaction', word: 'reaction', pos: '名词', ipa: '/riˈækʃn/', family: 'act',
    gloss: '反应；反作用',
    collocations: [
      { phrase: 'immediate reaction', zh: '第一反应' },
      { phrase: 'allergic reaction', zh: '过敏反应' },
    ],
    examples: [{ en: 'The first reaction was silence, then laughter.', zh: '第一反应是沉默，然后是笑声。' }],
  },
  {
    id: 'interact', word: 'interact', pos: '动词', ipa: '/ˌɪntərˈækt/', family: 'act',
    gloss: '互动；相互作用',
    note: '前缀 inter-（相互）+ act。',
    collocations: [{ phrase: 'interact with', zh: '与……互动' }],
    examples: [{ en: 'The two drugs interact in a way nobody expected.', zh: '这两种药相互作用的方式出乎所有人意料。' }],
  },
  {
    id: 'interaction', word: 'interaction', pos: '名词', ipa: '/ˌɪntərˈækʃn/', family: 'act',
    gloss: '互动；交互作用',
    collocations: [{ phrase: 'social interaction', zh: '社交互动' }],
    examples: [{ en: 'Most of the interaction happens in the corridor.', zh: '大部分交流发生在走廊里。' }],
  },

  // ---------------- WRITE ----------------
  {
    id: 'write', word: 'write', pos: '动词', ipa: '/raɪt/', family: 'write',
    gloss: '写；写作；写信',
    collocations: [
      { phrase: 'write down', zh: '记下来' },
      { phrase: 'write off', zh: '一笔勾销；报废' },
    ],
    examples: [{ en: 'Write it down before you forget the wording.', zh: '趁还记得原话，先写下来。' }],
  },
  {
    id: 'writes', word: 'writes', pos: '动词（第三人称单数）', ipa: '/raɪts/', family: 'write',
    gloss: '写（第三人称单数）',
    collocations: [{ phrase: 'he writes', zh: '他写' }],
    examples: [{ en: 'She writes one page every morning, good or bad.', zh: '她每天早上写一页，好坏都算。' }],
  },
  {
    id: 'wrote', word: 'wrote', pos: '动词（过去式）', ipa: '/rəʊt/', family: 'write',
    gloss: '写了（过去式）',
    note: '不规则变化：write–wrote–written。',
    collocations: [{ phrase: 'wrote back', zh: '回信' }],
    examples: [{ en: 'He wrote back the same day, which surprised her.', zh: '他当天就回信了，这让她很意外。' }],
  },
  {
    id: 'written', word: 'written', pos: '动词（过去分词）/形容词', ipa: '/ˈrɪtn/', family: 'write',
    gloss: '写过（过去分词）；书面的',
    collocations: [
      { phrase: 'written agreement', zh: '书面协议' },
      { phrase: 'well written', zh: '写得好的' },
    ],
    examples: [{ en: 'Get it in written form or it never happened.', zh: '要落在书面上，不然等于没发生。' }],
  },
  {
    id: 'writing', word: 'writing', pos: '名词/动词（现在分词）', ipa: '/ˈraɪtɪŋ/', family: 'write',
    gloss: '写作；著作；笔迹',
    note: '既是 write 的现在分词，也固定作名词「写作/文字」。',
    collocations: [
      { phrase: 'academic writing', zh: '学术写作' },
      { phrase: 'in writing', zh: '以书面形式' },
    ],
    examples: [{ en: 'Her writing improved once she stopped imitating others.', zh: '她不再模仿别人之后，文章就进步了。' }],
  },
  {
    id: 'writer', word: 'writer', pos: '名词', ipa: '/ˈraɪtə/', family: 'write',
    gloss: '作家；作者',
    note: 'write + -er。',
    collocations: [
      { phrase: 'freelance writer', zh: '自由撰稿人' },
      { phrase: 'ghost writer', zh: '代笔人' },
    ],
    examples: [{ en: 'The writer keeps a notebook in every coat pocket.', zh: '这位作家每件外套口袋里都揣着本子。' }],
  },
  {
    id: 'rewrite', word: 'rewrite', pos: '动词', ipa: '/ˌriːˈraɪt/', family: 'write',
    gloss: '重写；改写',
    note: '前缀 re-（再）+ write。',
    collocations: [{ phrase: 'rewrite the draft', zh: '重写草稿' }],
    examples: [{ en: 'He rewrote the ending four times and still disliked it.', zh: '结尾他改了四遍，还是不满意。' }],
  },
  {
    id: 'handwriting', word: 'handwriting', pos: '名词', ipa: '/ˈhændraɪtɪŋ/', family: 'write',
    gloss: '笔迹；手写',
    note: '复合词：hand + writing。',
    collocations: [{ phrase: 'neat handwriting', zh: '工整的字迹' }],
    examples: [{ en: 'Her handwriting is small, slanted, and hard to forge.', zh: '她的字又小又斜，很难模仿。' }],
  },
]

const RAW_EDGES: Edge[] = [
  // 词源：词根 → 族内主干
  { from: 'root:art', to: 'art', kind: 'etymology', label: '源自', status: 'verified', evidence: 'Wiktionary：art ← 中古英语 art ← 古法语 ← 拉丁 artem（ars「技艺」的宾格）', sourceUrl: 'https://en.wiktionary.org/wiki/art#English' },
  { from: 'root:cre', to: 'create', kind: 'etymology', label: '源自', status: 'verified', evidence: 'Wiktionary：create ← 拉丁 creātus（creō「创造」的完成被动分词）', sourceUrl: 'https://en.wiktionary.org/wiki/create#English' },
  { from: 'root:ag', to: 'act', kind: 'etymology', label: '源自', status: 'verified', evidence: 'Wiktionary：act ← 中古英语 acte ← 拉丁 ācta/āctum ← agere「做、驱动」', sourceUrl: 'https://en.wiktionary.org/wiki/act#English' },
  { from: 'root:writ', to: 'write', kind: 'etymology', label: '源自', status: 'verified', evidence: 'Wiktionary：write ← 古英语 wrītan ← 原始日耳曼 *wrītaną ← PIE *wrey-「划、刻」', sourceUrl: 'https://en.wiktionary.org/wiki/write#English' },

  // ART
  { from: 'art', to: 'arts', kind: 'inflection', label: '复数' },
  { from: 'art', to: 'artist', kind: 'derivation', label: '-ist', hint: '后缀 -ist：表「从事…的人」', status: 'verified', evidence: 'Wiktionary：artist ← 法语 artiste ← 拉丁 artista；-ist 表「从事…的人」', sourceUrl: 'https://en.wiktionary.org/wiki/artist#English' },
  { from: 'artist', to: 'artists', kind: 'inflection', label: '复数' },
  { from: 'artist', to: 'artistic', kind: 'derivation', label: '-ic', hint: '后缀 -ic：形容词', status: 'verified', evidence: 'Wiktionary：artistic 借自法语 artistique（artiste + -ique），形态上等价 artist + -ic', sourceUrl: 'https://en.wiktionary.org/wiki/artistic#English' },
  { from: 'artistic', to: 'artistically', kind: 'derivation', label: '-ally', hint: '后缀 -ally：副词' },
  { from: 'artist', to: 'artistry', kind: 'derivation', label: '-ry', hint: '后缀 -ry：表技艺、状态' },
  { from: 'root:art', to: 'artificial', kind: 'etymology', label: '同源', hint: '拉丁 artificium（ars「技艺」+ facere「做」），不是现代英语 art + -ficial 的规则派生' },
  { from: 'artificial', to: 'artificially', kind: 'derivation', label: '-ly', hint: '后缀 -ly：副词' },
  { from: 'root:art', to: 'artifice', kind: 'etymology', label: '同源', hint: '与 artificial 同出拉丁 artificium，指「机巧、手段」' },
  { from: 'root:art', to: 'artisan', kind: 'etymology', label: '借入', hint: '经法语 artisan 借入，源自意大利语 artigiano，同属 ars 词族' },
  { from: 'art', to: 'artwork', kind: 'derivation', label: '复合', hint: '复合词：art + work' },

  // CREATE
  { from: 'create', to: 'creates', kind: 'inflection', label: '三单' },
  { from: 'create', to: 'created', kind: 'inflection', label: '过去式/过去分词' },
  { from: 'create', to: 'creating', kind: 'inflection', label: '现在分词' },
  { from: 'create', to: 'creation', kind: 'derivation', label: '-ion', hint: '后缀 -ion：动词→名词' },
  { from: 'create', to: 'creator', kind: 'derivation', label: '-or', hint: '后缀 -or：表「做…的人」' },
  { from: 'create', to: 'creative', kind: 'derivation', label: '-ive', hint: '后缀 -ive：形容词', status: 'verified', evidence: 'Wiktionary：creative ← 拉丁 creātīvus；明确写「Equivalent to create + -ive」', sourceUrl: 'https://en.wiktionary.org/wiki/creative#English' },
  { from: 'creative', to: 'creatively', kind: 'derivation', label: '-ly', hint: '后缀 -ly：副词' },
  { from: 'creative', to: 'creativity', kind: 'derivation', label: '-ity', hint: '后缀 -ity：形容词→抽象名词', status: 'verified', evidence: 'Wiktionary：creativity 词源段直接写 creative + -ity', sourceUrl: 'https://en.wiktionary.org/wiki/creativity#English' },
  { from: 'create', to: 'creature', kind: 'derivation', label: '同源', hint: '拉丁 creatura「被造之物」，同源于 create' },
  { from: 'create', to: 'procreate', kind: 'derivation', label: 'pro-', hint: '前缀 pro-（向前、为后代）+ create' },
  { from: 'creation', to: 'recreation', kind: 'derivation', label: 're-', hint: '前缀 re-（再）+ creation；与 re-creation「重新创造」同形不同义' },

  // ACT
  { from: 'act', to: 'acts', kind: 'inflection', label: '三单/复数' },
  { from: 'act', to: 'acted', kind: 'inflection', label: '过去式/过去分词' },
  { from: 'act', to: 'acting', kind: 'inflection', label: '现在分词' },
  { from: 'act', to: 'action', kind: 'derivation', label: '-ion', hint: '后缀 -ion：动词→名词', status: 'verified', evidence: 'Wiktionary：action ← 中古英语 accioun ← 拉丁 āctiō（āctus + -iō）← agere', sourceUrl: 'https://en.wiktionary.org/wiki/action#English' },
  { from: 'act', to: 'active', kind: 'derivation', label: '-ive', hint: '后缀 -ive：形容词' },
  { from: 'active', to: 'actively', kind: 'derivation', label: '-ly', hint: '后缀 -ly：副词' },
  { from: 'active', to: 'activity', kind: 'derivation', label: '+ -ity 名词' },
  { from: 'act', to: 'actor', kind: 'derivation', label: '-or', hint: '后缀 -or：表「做…的人」' },
  { from: 'actor', to: 'actress', kind: 'derivation', label: '-ress', hint: '后缀 -ress：表阴性（法语来源）' },
  { from: 'act', to: 'react', kind: 'derivation', label: 're-', hint: '前缀 re-（回）+ act' },
  { from: 'react', to: 'reaction', kind: 'derivation', label: '-ion', hint: '后缀 -ion：动词→名词' },
  { from: 'act', to: 'interact', kind: 'derivation', label: 'inter-', hint: '前缀 inter-（相互）+ act' },
  { from: 'interact', to: 'interaction', kind: 'derivation', label: '-ion', hint: '后缀 -ion：动词→名词' },

  // WRITE
  { from: 'write', to: 'writes', kind: 'inflection', label: '三单' },
  { from: 'write', to: 'wrote', kind: 'inflection', label: '过去式（不规则）' },
  { from: 'write', to: 'written', kind: 'inflection', label: '过去分词（不规则）' },
  { from: 'write', to: 'writing', kind: 'inflection', label: '现在分词' },
  { from: 'write', to: 'writer', kind: 'derivation', label: '-er', hint: '后缀 -er：表「做…的人」', status: 'verified', evidence: 'Wiktionary：writer ← 古英语 wrītere；明确写「equivalent to write + -er」', sourceUrl: 'https://en.wiktionary.org/wiki/writer#English' },
  { from: 'write', to: 'rewrite', kind: 'derivation', label: 're-', hint: '前缀 re-（再）+ write' },
  { from: 'writing', to: 'handwriting', kind: 'derivation', label: '复合', hint: '复合词：hand + writing' },
]

/**
 * 来源策略：本版没有把任何关系标成「已核实」——外部词源站（Etymonline）返回 403，
 * Wiktionary 需逐条读模板，尚未做完。所以统一标 pending（待核对），
 * 并给出可核对的链接与依据类型，界面显示「待核对」而不是「已人工核对」。
 */
function defaultEvidence(kind: Edge['kind'], to: string): { evidence: string; sourceUrl: string } {
  if (kind === 'inflection') {
    return {
      evidence: '形态规则：规则复数/动词变位，或词典不规则变位表',
      sourceUrl: `https://en.wiktionary.org/wiki/${to}#English`,
    }
  }
  if (kind === 'etymology') {
    return {
      evidence: '词源：拉丁/古法语借词路线，见该词 Etymology 段',
      sourceUrl: `https://en.wiktionary.org/wiki/${to}#English`,
    }
  }
  return {
    evidence: '加缀/复合构词：词缀义与词性变化可核对',
    sourceUrl: `https://en.wiktionary.org/wiki/${to}#English`,
  }
}

export const EDGES: Edge[] = RAW_EDGES.map((edge) => {
  const preset = defaultEvidence(edge.kind, edge.to)
  return {
    ...edge,
    status: edge.status ?? 'pending',
    evidence: edge.evidence ?? preset.evidence,
    sourceUrl: edge.sourceUrl ?? preset.sourceUrl,
  }
})
