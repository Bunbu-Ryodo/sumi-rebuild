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

export type QuoteType = {  
    id: number;
    userid: string;
    quote: string;
    title: string;
    author: string; 
    textid: number;
    extractid: number; 
    portrait: string; 
    chapter: number;
    year: string;
    coverart: string;
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

export type SeriesType = {
    id: number;
    userid: string;
    subscriptionid: number;
    title: string;
    author: string;
    extracts: ExtractType[];
    subscribeart: string;
    sequeldue: number;
    earnedchapters: number;
    totalchapters: number;
    hidden: boolean;
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



