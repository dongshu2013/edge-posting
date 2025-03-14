import {
  FaceSmileIcon,
  FaceFrownIcon,
  HeartIcon,
  FireIcon,
  SparklesIcon,
  CloudIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

export const moods = [
  { id: "happy", label: "Happy", icon: FaceSmileIcon },
  { id: "sad", label: "Sad", icon: FaceFrownIcon },
  { id: "loving", label: "Loving", icon: HeartIcon },
  { id: "energetic", label: "Energetic", icon: FireIcon },
  { id: "excited", label: "Excited", icon: SparklesIcon },
  { id: "peaceful", label: "Peaceful", icon: CloudIcon },
  { id: "optimistic", label: "Optimistic", icon: SunIcon },
  { id: "relaxed", label: "Relaxed", icon: MoonIcon },
] as const;

export type Mood = (typeof moods)[number]["id"];
