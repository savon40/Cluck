import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface HabitIconProps {
  name: string;
  size: number;
  color: string;
}

/** Renders a habit icon. Use "mci:" prefix for MaterialCommunityIcons, otherwise Ionicons. */
export default function HabitIcon({ name, size, color }: HabitIconProps) {
  if (name.startsWith('mci:')) {
    return <MaterialCommunityIcons name={name.slice(4) as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}
