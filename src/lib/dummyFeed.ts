export interface FeedItem {
  id: string;
  sentence: string;
  likes: number;
  likedByMe: boolean;
  location: string; // e.g. "Reykjavík"
  weather: string; // e.g. "Light snow"
  time: string; // e.g. "2:14 AM"
  isMine?: boolean;
}

// TODO: replace with Supabase — fetch today's public sentences instead of this
// local dummy array. Shape stays the same (FeedItem[]).
export const dummyFeed: FeedItem[] = [
  {
    id: "f1",
    sentence: "I keep a list of doors I never walked through.",
    likes: 38,
    likedByMe: false,
    location: "Reykjavík",
    weather: "Light snow",
    time: "2:14 AM",
  },
  {
    id: "f2",
    sentence: "The vending machine and I have an understanding now.",
    likes: 12,
    likedByMe: false,
    location: "Osaka",
    weather: "Clear",
    time: "11:47 AM",
  },
  {
    id: "f3",
    sentence: "Grief is just love with nowhere left to be on time for.",
    likes: 91,
    likedByMe: true,
    location: "Lisbon",
    weather: "Light rain",
    time: "7:02 PM",
  },
  {
    id: "f4",
    sentence: "My houseplant is thriving out of pure spite, I think.",
    likes: 27,
    likedByMe: false,
    location: "Portland",
    weather: "Overcast",
    time: "9:31 AM",
  },
  {
    id: "f5",
    sentence: "Told the ocean a secret and it just kept doing its thing.",
    likes: 54,
    likedByMe: false,
    location: "Cape Town",
    weather: "Windy",
    time: "5:55 PM",
  },
  {
    id: "f6",
    sentence: "Everyone on this train is pretending the same thing.",
    likes: 19,
    likedByMe: false,
    location: "Berlin",
    weather: "Fog",
    time: "8:08 AM",
  },
  {
    id: "f7",
    sentence: "I bought a lamp shaped like the feeling of Sunday.",
    likes: 43,
    likedByMe: false,
    location: "Montréal",
    weather: "Snow flurries",
    time: "3:20 PM",
  },
  {
    id: "f8",
    sentence: "Some days the moon clocks in before I clock out.",
    likes: 66,
    likedByMe: true,
    location: "Buenos Aires",
    weather: "Partly cloudy",
    time: "6:44 PM",
  },
  {
    id: "f9",
    sentence: "The dog understood the assignment; I did not.",
    likes: 8,
    likedByMe: false,
    location: "Dublin",
    weather: "Drizzle",
    time: "1:13 PM",
  },
  {
    id: "f10",
    sentence: "I am the third most interesting thing in this room.",
    likes: 31,
    likedByMe: false,
    location: "Seoul",
    weather: "Hazy",
    time: "10:26 PM",
  },
];

// Dummy count of people who "played today" — includes private plays that don't
// surface in the visible feed.
// TODO: replace with Supabase — real count of today's plays (public + private).
export const dummyPlayedToday = 46;
