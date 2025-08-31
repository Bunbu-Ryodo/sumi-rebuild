export type ExtractType = {
    id: number;
    textid: number;
    author: string;
    title: string;
    year: string;
    chapter: number;
    fulltext: string;
    subscribeart: string;
    portrait: string;
    coverart: string;
    coverartArtist: string;
    coverartYear: number;   
    coverartTitle: string;
    totalchapters: number;
}

export type ArtworkType = {
    id: number,
    userid: string,
    title: string,
    artist: string,
    year: number,
    url: string
    posted: boolean;
}

export type ArtworkPostType = {
    id: number;
    username: string,
    userid: string;
    artist: string;
    title: string;
    year: number;
    url: string;
}

export type ExtractComponent = {
    id: number;
    textid: number;
    author: string;
    title: string;
    year: string;
    chapter: number;
    fulltext: string;
    subscribeart: string;
    portrait: string;
    coverart: string;
    coverartArtist: string;
    coverartYear: number;   
    coverartTitle: string;
    userid: string;
}

export type SubscriptionType = {
    id: number;
    textid: number;
    title: string;
    author: string;
    chapter: number;
    due: number;
    active: boolean;
    subscribeart: string;
}

export type SubscriptionTypeClient = {
    id: number;
    title: string;
    author: string;
    chapter: number;
    due: number;
    subscribeart: string;
}

export type InstalmentType = {
    id: number;
    extractid: number;
    userid: string;
    title: string;   
    author: string;
    chapter: string;
    subscriptionid: number;   
    subscribeart: string;
    sequeldue: number;
}

export type InstalmentTypeClient = {
    id: number;
    extractid: number;
    title: string;   
    author: string;
    chapter: string;
    subscribeart: string;
    sequeldue: number;
    onLongPress?: () => void;
}

export type AchievementType = {
    id: number;
    title: string;
    description: string;
    score: number;
    icon: string;
    tier: string;
}

export type AchievementTypeClient = {
    id: number;
    title: string;
    description: string;
    score: number;
    icon: string;
    date: string;
    tier: string;
}

export type PendingAchievementType = {
    id: number;
    title: string;
    description: string;
    score: number;
    icon: string;
    achievementProgress: number;
}



