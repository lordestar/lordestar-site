export type Locale = 'zh' | 'en';

export const ui = {
  zh: {
    site: {
      name: 'lordestar',
      tagline: '音乐、代码与互联网文化之间',
      description:
        'lordestar 的个人网站：音乐作品、代码作品、经历与随想。北京交通大学软件工程本科生。',
    },
    nav: { home: '首页', about: '关于', works: '作品', thoughts: '想法' },
    hero: {
      role: 'software student · music maker · internet culture enjoyer',
      replay: 'Replay',
      scroll: 'SCROLL',
    },
    home: {
      marquee: ['music', 'code', 'internet culture', 'experiments', 'stories'],
      aboutEyebrow: 'About',
      aboutTitle: '一个在代码与声音之间游走的人',
      aboutBody:
        '我是北京交通大学软件工程专业的本科生，热爱音乐，也热爱技术。这里记录我的作品、经历和一些碎片想法。',
      aboutCta: '了解更多',
      worksEyebrow: 'Selected Works',
      worksTitle: '近期作品',
      worksCta: '查看全部作品',
      musicEyebrow: 'Music Corner',
      musicTitle: '声音实验',
      musicBody: '这里会放上我做的音乐作品，可以上传音频文件，也可以挂载网易云、B 站等外部链接。',
      musicPlaceholder: '音频文件上传后，这里会出现可播放的可视化播放器。',
      thoughtsEyebrow: 'Thoughts',
      thoughtsTitle: '最近的感想',
      thoughtsCta: '阅读全部',
      contactEyebrow: 'Contact',
      contactTitle: '保持联系',
      contactBody: '想聊聊音乐、代码或者随便什么，都可以找到我。',
      emailLabel: 'Email',
    },
    works: {
      title: '作品',
      subtitle: '音乐与代码，两条互相交织的轨道。',
      all: '全部',
      music: '音乐',
      code: '代码',
      play: '播放',
      pause: '暂停',
      external: '外部链接',
      empty: '这个分类还没有作品，之后会补上。',
    },
    thoughts: {
      title: '想法',
      subtitle: '一些关于音乐、技术与生活的碎片记录。',
      readMore: '阅读全文',
      empty: '还没有文章，之后会补上。',
    },
    about: {
      title: '关于我',
      subtitle: 'lordestar · 北京交通大学软件工程本科在读',
      bioTitle: '我是谁',
      bioBody:
        '一个喜欢音乐、喜欢互联网流行文化的软件工程学生。白天写代码，晚上做点声音实验，偶尔把想法写成文字。',
      factsTitle: '一些事实',
      facts: [
        { label: '专业', value: '软件工程' },
        { label: '城市', value: '北京' },
        { label: '身份', value: '本科生' },
        { label: '兴趣', value: '音乐 / 互联网文化' },
      ],
      timelineTitle: '轨迹',
      timeline: [
        { date: '2023 - 现在', title: '北京交通大学 · 软件工程', text: '本科在读，探索技术、设计与表达。' },
        { date: '更早', title: '开始做音乐与尝试创作', text: '从听歌到做歌，从用软件到写软件。' },
      ],
      toolsTitle: '常出没的地方',
      tools: ['GitHub', '网易云音乐', 'Bilibili', 'Spotify'],
    },
    footer: {
      line: 'made with music & code',
      rights: 'All rights reserved.',
    },
  },
  en: {
    site: {
      name: 'lordestar',
      tagline: 'between music, code and internet culture',
      description:
        "lordestar's personal site: music works, code works, experiences and thoughts. Software engineering undergraduate at Beijing Jiaotong University.",
    },
    nav: { home: 'Home', about: 'About', works: 'Works', thoughts: 'Thoughts' },
    hero: {
      role: 'software student · music maker · internet culture enjoyer',
      replay: 'Replay',
      scroll: 'SCROLL',
    },
    home: {
      marquee: ['music', 'code', 'internet culture', 'experiments', 'stories'],
      aboutEyebrow: 'About',
      aboutTitle: 'Someone who drifts between code and sound',
      aboutBody:
        "I'm an undergraduate software engineering student at Beijing Jiaotong University. I love music and technology. This is where I keep my works, experiences and scattered thoughts.",
      aboutCta: 'More about me',
      worksEyebrow: 'Selected Works',
      worksTitle: 'Recent works',
      worksCta: 'View all works',
      musicEyebrow: 'Music Corner',
      musicTitle: 'Sound experiments',
      musicBody:
        'Music I make, with playable audio files or external links to NetEase Cloud Music, Bilibili and more.',
      musicPlaceholder: 'Once an audio file is uploaded, a playable visualizer will appear here.',
      thoughtsEyebrow: 'Thoughts',
      thoughtsTitle: 'Recent thoughts',
      thoughtsCta: 'Read all',
      contactEyebrow: 'Contact',
      contactTitle: 'Stay in touch',
      contactBody: 'About music, code, or anything at all — you can find me here.',
      emailLabel: 'Email',
    },
    works: {
      title: 'Works',
      subtitle: 'Music and code, two tracks that keep crossing.',
      all: 'All',
      music: 'Music',
      code: 'Code',
      play: 'Play',
      pause: 'Pause',
      external: 'External link',
      empty: 'Nothing in this category yet. Coming soon.',
    },
    thoughts: {
      title: 'Thoughts',
      subtitle: 'Scattered notes on music, technology and everyday life.',
      readMore: 'Read more',
      empty: 'No posts yet. Coming soon.',
    },
    about: {
      title: 'About me',
      subtitle: 'lordestar · Software engineering undergraduate at BJTU',
      bioTitle: 'Who I am',
      bioBody:
        'A software engineering student who likes music and internet culture. I write code during the day, experiment with sound at night, and occasionally turn thoughts into words.',
      factsTitle: 'Some facts',
      facts: [
        { label: 'Major', value: 'Software engineering' },
        { label: 'City', value: 'Beijing' },
        { label: 'Status', value: 'Undergraduate' },
        { label: 'Interests', value: 'Music / internet culture' },
      ],
      timelineTitle: 'Trajectory',
      timeline: [
        { date: '2023 - now', title: 'Beijing Jiaotong University · SE', text: 'Undergraduate, exploring technology, design and expression.' },
        { date: 'Earlier', title: 'Started making music', text: 'From listening to music to making it, from using software to writing it.' },
      ],
      toolsTitle: 'Where I hang out',
      tools: ['GitHub', 'NetEase Cloud Music', 'Bilibili', 'Spotify'],
    },
    footer: {
      line: 'made with music & code',
      rights: 'All rights reserved.',
    },
  },
} as const;

export const locales: Locale[] = ['zh', 'en'];

export function localeFromId(id: string): Locale {
  return id.startsWith('en/') ? 'en' : 'zh';
}

export function entriesFor<T extends { id: string }>(entries: T[], locale: Locale): T[] {
  return entries.filter((entry) => localeFromId(entry.id) === locale);
}

