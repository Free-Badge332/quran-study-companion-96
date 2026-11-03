// Curated remembrance and supplications with references.
// Quran items reference chapter/verses and render from the bundled Quran text, so the Arabic is never retyped.
export type QuranRef = { chapter: number; from: number; to?: number };
export type Dhikr = {
  id: string;
  ar?: string;
  quran?: QuranRef[];
  en: string;
  count: number;
  ref: string;
};
export type DhikrCategory = { id: string; titleKey: "morningAzkar" | "eveningAzkar" | "afterPrayerAzkar" | "sleepAzkar" | "catQuranic" | "catDaily" | "catDistress" | "catFasting"; items: Dhikr[] };

const AYAT_KURSI: QuranRef[] = [{ chapter: 2, from: 255 }];
const MUAWWIDHAT: QuranRef[] = [
  { chapter: 112, from: 1, to: 4 },
  { chapter: 113, from: 1, to: 5 },
  { chapter: 114, from: 1, to: 6 },
];
const LA_ILAHA = "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ";
const LA_ILAHA_EN = "None has the right to be worshipped but Allah alone, without partner. His is the dominion and His is the praise, and He is over all things capable.";
const SAYYID = {
  ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
  en: "O Allah, You are my Lord; none has the right to be worshipped but You. You created me and I am Your servant, and I keep Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.",
  ref: "Sahih al-Bukhari 6306",
};

const shared = (when: "m" | "e"): Dhikr[] => [
  { id: `${when}-kursi`, quran: AYAT_KURSI, en: "Ayat al-Kursi.", count: 1, ref: "An-Nasa'i, As-Sunan al-Kubra 9848" },
  { id: `${when}-quls`, quran: MUAWWIDHAT, en: "Surah al-Ikhlas, al-Falaq and an-Nas.", count: 3, ref: "Abu Dawud 5082; At-Tirmidhi 3575" },
  when === "m"
    ? {
        id: "m-asbahna",
        ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، " + LA_ILAHA + "، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        en: "We have entered the morning and the dominion belongs to Allah, and praise is for Allah. " + LA_ILAHA_EN + " My Lord, I ask You for the good of this day and the good after it, and I seek refuge in You from the evil of this day and the evil after it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.",
        count: 1,
        ref: "Sahih Muslim 2723",
      }
    : {
        id: "e-amsayna",
        ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، " + LA_ILAHA + "، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        en: "We have entered the evening and the dominion belongs to Allah, and praise is for Allah. " + LA_ILAHA_EN + " My Lord, I ask You for the good of this night and the good after it, and I seek refuge in You from the evil of this night and the evil after it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.",
        count: 1,
        ref: "Sahih Muslim 2723",
      },
  when === "m"
    ? { id: "m-bika", ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", en: "O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.", count: 1, ref: "At-Tirmidhi 3391" }
    : { id: "e-bika", ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", en: "O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.", count: 1, ref: "At-Tirmidhi 3391" },
  { id: `${when}-sayyid`, ...SAYYID, count: 1 },
  { id: `${when}-bismillah`, ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the All-Hearing, the All-Knowing.", count: 3, ref: "Abu Dawud 5088; At-Tirmidhi 3388" },
  { id: `${when}-radhitu`, ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا", en: "I am pleased with Allah as my Lord, Islam as my religion and Muhammad ﷺ as my Prophet.", count: 3, ref: "Abu Dawud 5072" },
  { id: `${when}-hasbiya`, ar: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ", en: "Allah is sufficient for me; none has the right to be worshipped but Him. Upon Him I rely, and He is the Lord of the Mighty Throne.", count: 7, ref: "Abu Dawud 5081" },
  { id: `${when}-hayy`, ar: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ", en: "O Ever-Living, O Sustainer, by Your mercy I seek help. Set right all my affairs and do not leave me to myself even for the blink of an eye.", count: 1, ref: "An-Nasa'i, As-Sunan al-Kubra 10405; Al-Hakim 2000" },
  ...(when === "e"
    ? [{ id: "e-kalimat", ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", en: "I seek refuge in the perfect words of Allah from the evil of what He has created.", count: 3, ref: "Sahih Muslim 2709" }]
    : []),
  { id: `${when}-subhan`, ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", en: "Glory be to Allah and praise be to Him.", count: 100, ref: "Sahih Muslim 2692" },
  ...(when === "m"
    ? [
        { id: "m-tahlil", ar: LA_ILAHA, en: LA_ILAHA_EN, count: 100, ref: "Sahih al-Bukhari 3293; Sahih Muslim 2691" },
        { id: "m-istighfar", ar: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", en: "I seek Allah's forgiveness and turn to Him in repentance.", count: 100, ref: "Sahih al-Bukhari 6307; Sahih Muslim 2702" },
      ]
    : []),
];

export const AZKAR: DhikrCategory[] = [
  { id: "morning", titleKey: "morningAzkar", items: shared("m") },
  { id: "evening", titleKey: "eveningAzkar", items: shared("e") },
  {
    id: "after-prayer",
    titleKey: "afterPrayerAzkar",
    items: [
      { id: "p-istighfar", ar: "أَسْتَغْفِرُ اللَّهَ", en: "I seek Allah's forgiveness.", count: 3, ref: "Sahih Muslim 591" },
      { id: "p-salam", ar: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", en: "O Allah, You are Peace and from You is peace. Blessed are You, O Owner of majesty and honour.", count: 1, ref: "Sahih Muslim 591" },
      { id: "p-mani", ar: LA_ILAHA + "، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ", en: LA_ILAHA_EN + " O Allah, none can withhold what You give, none can give what You withhold, and the wealth of the wealthy cannot benefit him against You.", count: 1, ref: "Sahih al-Bukhari 844; Sahih Muslim 593" },
      { id: "p-subhan", ar: "سُبْحَانَ اللَّهِ", en: "Glory be to Allah.", count: 33, ref: "Sahih Muslim 597" },
      { id: "p-hamd", ar: "الْحَمْدُ لِلَّهِ", en: "All praise is for Allah.", count: 33, ref: "Sahih Muslim 597" },
      { id: "p-akbar", ar: "اللَّهُ أَكْبَرُ", en: "Allah is the Greatest.", count: 33, ref: "Sahih Muslim 597" },
      { id: "p-tahlil", ar: LA_ILAHA, en: LA_ILAHA_EN + " (completing one hundred)", count: 1, ref: "Sahih Muslim 597" },
      { id: "p-kursi", quran: AYAT_KURSI, en: "Ayat al-Kursi.", count: 1, ref: "An-Nasa'i, As-Sunan al-Kubra 9928" },
      { id: "p-quls", quran: MUAWWIDHAT, en: "Surah al-Ikhlas, al-Falaq and an-Nas.", count: 1, ref: "Abu Dawud 1523" },
    ],
  },
  {
    id: "sleep",
    titleKey: "sleepAzkar",
    items: [
      { id: "s-quls", quran: MUAWWIDHAT, en: "Cup the hands, recite al-Ikhlas, al-Falaq and an-Nas, blow into them and wipe over the body.", count: 3, ref: "Sahih al-Bukhari 5017" },
      { id: "s-kursi", quran: AYAT_KURSI, en: "Ayat al-Kursi.", count: 1, ref: "Sahih al-Bukhari 2311" },
      { id: "s-baqarah", quran: [{ chapter: 2, from: 285, to: 286 }], en: "The last two verses of Surah al-Baqarah.", count: 1, ref: "Sahih al-Bukhari 5009" },
      { id: "s-subhan", ar: "سُبْحَانَ اللَّهِ", en: "Glory be to Allah.", count: 33, ref: "Sahih al-Bukhari 3113; Sahih Muslim 2727" },
      { id: "s-hamd", ar: "الْحَمْدُ لِلَّهِ", en: "All praise is for Allah.", count: 33, ref: "Sahih al-Bukhari 3113; Sahih Muslim 2727" },
      { id: "s-akbar", ar: "اللَّهُ أَكْبَرُ", en: "Allah is the Greatest.", count: 34, ref: "Sahih al-Bukhari 3113; Sahih Muslim 2727" },
      { id: "s-qini", ar: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", en: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.", count: 3, ref: "Abu Dawud 5045" },
      { id: "s-bismika", ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", en: "In Your name, O Allah, I die and I live.", count: 1, ref: "Sahih al-Bukhari 6324" },
    ],
  },
];

export const DUAS: DhikrCategory[] = [
  {
    id: "quranic",
    titleKey: "catQuranic",
    items: [
      { id: "q-2-201", quran: [{ chapter: 2, from: 201 }], en: "", count: 1, ref: "Quran 2:201" },
      { id: "q-2-127", quran: [{ chapter: 2, from: 127 }], en: "", count: 1, ref: "Quran 2:127" },
      { id: "q-2-286", quran: [{ chapter: 2, from: 286 }], en: "", count: 1, ref: "Quran 2:286" },
      { id: "q-3-8", quran: [{ chapter: 3, from: 8 }], en: "", count: 1, ref: "Quran 3:8" },
      { id: "q-7-23", quran: [{ chapter: 7, from: 23 }], en: "", count: 1, ref: "Quran 7:23" },
      { id: "q-14-40", quran: [{ chapter: 14, from: 40, to: 41 }], en: "", count: 1, ref: "Quran 14:40–41" },
      { id: "q-17-24", quran: [{ chapter: 17, from: 24 }], en: "", count: 1, ref: "Quran 17:24" },
      { id: "q-18-10", quran: [{ chapter: 18, from: 10 }], en: "", count: 1, ref: "Quran 18:10" },
      { id: "q-20-114", quran: [{ chapter: 20, from: 114 }], en: "", count: 1, ref: "Quran 20:114" },
      { id: "q-25-74", quran: [{ chapter: 25, from: 74 }], en: "", count: 1, ref: "Quran 25:74" },
      { id: "q-28-24", quran: [{ chapter: 28, from: 24 }], en: "", count: 1, ref: "Quran 28:24" },
      { id: "q-59-10", quran: [{ chapter: 59, from: 10 }], en: "", count: 1, ref: "Quran 59:10" },
    ],
  },
  {
    id: "daily",
    titleKey: "catDaily",
    items: [
      { id: "d-wake", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", en: "On waking: All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.", count: 1, ref: "Sahih al-Bukhari 6312" },
      { id: "d-clothes", ar: "الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", en: "Wearing clothes: All praise is for Allah who clothed me with this and provided it for me without any power or strength from me.", count: 1, ref: "Abu Dawud 4023" },
      { id: "d-toilet-in", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", en: "Entering the toilet: O Allah, I seek refuge in You from evil and evil beings.", count: 1, ref: "Sahih al-Bukhari 142; Sahih Muslim 375" },
      { id: "d-toilet-out", ar: "غُفْرَانَكَ", en: "Leaving the toilet: I seek Your forgiveness.", count: 1, ref: "Abu Dawud 30; At-Tirmidhi 7" },
      { id: "d-leave-home", ar: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", en: "Leaving home: In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.", count: 1, ref: "Abu Dawud 5095; At-Tirmidhi 3426" },
      { id: "d-mosque-in", ar: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", en: "Entering the mosque: O Allah, open for me the doors of Your mercy.", count: 1, ref: "Sahih Muslim 713" },
      { id: "d-mosque-out", ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", en: "Leaving the mosque: O Allah, I ask You of Your bounty.", count: 1, ref: "Sahih Muslim 713" },
      { id: "d-eat", ar: "بِسْمِ اللَّهِ", en: "Before eating: In the name of Allah. If you forget at the start, say: بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ (In the name of Allah at its beginning and its end).", count: 1, ref: "Abu Dawud 3767; At-Tirmidhi 1858" },
      { id: "d-ate", ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا، وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", en: "After eating: All praise is for Allah who fed me this and provided it for me without any power or strength from me.", count: 1, ref: "Abu Dawud 4023; At-Tirmidhi 3458" },
      { id: "d-travel", quran: [{ chapter: 43, from: 13, to: 14 }], en: "Travelling: said when mounting a vehicle.", count: 1, ref: "Quran 43:13–14; Sahih Muslim 1342" },
      { id: "d-sneeze", ar: "الْحَمْدُ لِلَّهِ — يَرْحَمُكَ اللَّهُ — يَهْدِيكُمُ اللَّهُ وَيُصْلِحُ بَالَكُمْ", en: "Sneezing: the one who sneezes says “All praise is for Allah”; the listener replies “May Allah have mercy on you”; and the sneezer answers “May Allah guide you and set your affairs right.”", count: 1, ref: "Sahih al-Bukhari 6224" },
    ],
  },
  {
    id: "distress",
    titleKey: "catDistress",
    items: [
      { id: "x-yunus", quran: [{ chapter: 21, from: 87 }], en: "", count: 1, ref: "Quran 21:87; At-Tirmidhi 3505" },
      { id: "x-karb", ar: "لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ", en: "None has the right to be worshipped but Allah, the Mighty, the Forbearing. None has the right to be worshipped but Allah, Lord of the Mighty Throne. None has the right to be worshipped but Allah, Lord of the heavens, Lord of the earth and Lord of the Noble Throne.", count: 1, ref: "Sahih al-Bukhari 6346; Sahih Muslim 2730" },
      { id: "x-hamm", ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ", en: "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from miserliness and cowardice, from the burden of debt and from being overpowered by men.", count: 1, ref: "Sahih al-Bukhari 6369" },
      { id: "x-hasbuna", quran: [{ chapter: 3, from: 173 }], en: "", count: 1, ref: "Quran 3:173; Sahih al-Bukhari 4563" },
      { id: "x-sayyid", ...SAYYID, count: 1 },
    ],
  },
  {
    id: "fasting",
    titleKey: "catFasting",
    items: [
      { id: "f-iftar", ar: "ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", en: "On breaking the fast: The thirst has gone, the veins are moistened, and the reward is certain, if Allah wills.", count: 1, ref: "Abu Dawud 2357" },
      { id: "f-qadr", ar: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", en: "Laylat al-Qadr: O Allah, You are Pardoning and love to pardon, so pardon me.", count: 1, ref: "At-Tirmidhi 3513" },
      { id: "f-feed", ar: "اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي، وَاسْقِ مَنْ سَقَانِي", en: "For one who gives you food: O Allah, feed the one who fed me and give drink to the one who gave me drink.", count: 1, ref: "Sahih Muslim 2055" },
      { id: "f-saim", ar: "إِنِّي صَائِمٌ", en: "If someone insults or fights you while fasting: I am fasting.", count: 1, ref: "Sahih al-Bukhari 1904" },
      { id: "f-hilal", ar: "اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ", en: "On seeing the new moon: O Allah, bring it over us with blessing and faith, safety and Islam. My Lord and your Lord is Allah.", count: 1, ref: "At-Tirmidhi 3451" },
      { id: "f-fasting-verse", quran: [{ chapter: 2, from: 183 }], en: "", count: 1, ref: "Quran 2:183" },
    ],
  },
];
