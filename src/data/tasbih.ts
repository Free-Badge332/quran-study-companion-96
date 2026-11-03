// Short dhikr phrases for the free Tasbih counter, each with its authentic source.
export type TasbihPhrase = {
  id: string;
  ar: string;
  translit: string;
  en: string;
  target: number;
  ref: string;
};

export const TASBIH_PHRASES: TasbihPhrase[] = [
  {
    id: "subhanallah",
    ar: "سُبْحَانَ اللَّهِ",
    translit: "Subḥān Allāh",
    en: "Glory be to Allah",
    target: 33,
    ref: "Sahih Muslim 597",
  },
  {
    id: "alhamdulillah",
    ar: "الْحَمْدُ لِلَّهِ",
    translit: "Al-ḥamdu lillāh",
    en: "All praise is for Allah",
    target: 33,
    ref: "Sahih Muslim 597",
  },
  {
    id: "allahuakbar",
    ar: "اللَّهُ أَكْبَرُ",
    translit: "Allāhu akbar",
    en: "Allah is the Greatest",
    target: 33,
    ref: "Sahih Muslim 597",
  },
  {
    id: "tahlil",
    ar: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    translit: "Lā ilāha illā Allāh",
    en: "None has the right to be worshipped but Allah",
    target: 100,
    ref: "Jami' at-Tirmidhi 3383",
  },
  {
    id: "istighfar",
    ar: "أَسْتَغْفِرُ اللَّهَ",
    translit: "Astaghfirullāh",
    en: "I seek Allah's forgiveness",
    target: 100,
    ref: "Sahih Muslim 2702",
  },
  {
    id: "subhanallahi-wabihamdihi",
    ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    translit: "Subḥān Allāhi wa bi-ḥamdih",
    en: "Glory and praise be to Allah",
    target: 100,
    ref: "Sahih al-Bukhari 6405; Sahih Muslim 2691",
  },
  {
    id: "salawat",
    ar: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ",
    translit: "Allāhumma ṣalli ʿalā Muḥammad",
    en: "O Allah, send blessings upon Muhammad",
    target: 100,
    ref: "Sahih Muslim 408",
  },
];
