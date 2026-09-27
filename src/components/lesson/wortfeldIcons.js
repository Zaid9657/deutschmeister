// The lucide icons the Wortfeld picture cards can draw, imported BY NAME.
//
// WORTFELD_ICONS (src/data/curricula/a11.meta.js) maps each word to an icon
// name, and WortfeldStage used to resolve that name against a namespace import
// of the whole package. A namespace object indexed at runtime cannot be
// tree-shaken, so it put all ~1,300 icons (~600 KB) into the lesson player's
// chunk to draw these 99. tests/course-meta.test.mjs pins
// that every name WORTFELD_ICONS uses, and the fallback, is in this map;
// tests/web-performance.test.mjs bans the namespace import app-wide.
import {
  AlarmClock, AlarmClockOff, AlertCircle, AppWindow, Armchair, ArrowLeftRight, AtSign, Baby,
  Backpack, BedDouble, Beer, Book, BookMarked, BookOpen, Briefcase, Building, Building2, Bus, Cake,
  CakeSlice, CalendarClock, CalendarDays, Car, ChefHat, Clock, Coffee, Computer, Contact,
  Croissant, CupSoda, DoorClosed, DoorOpen, Euro, FileSignature, FileText, Film, Flag, Gift,
  GlassWater, Globe, Goal, GraduationCap, Hand, Hash, Headphones, Heart, HelpCircle, Home,
  Hourglass, Image as ImageIcon, Key, Lamp, Languages, LayoutGrid, Mailbox, MapPin, MessageCircle,
  Moon, MoveRight, Music2, Newspaper, Palette, PartyPopper, PenLine, Pencil, Phone, PhoneCall, Play,
  Radio, Ruler, Salad, School, Scissors, Send, ShoppingBag, ShoppingCart, ShowerHead, Smartphone,
  Smile, Soup, Sparkle, Stethoscope, Store, Sun, Sunrise, Sunset, Table2, Tag, ThumbsUp, Ticket,
  TrainFront, Type, User, Users, Utensils, UtensilsCrossed, Waves, Wine, Zap,
} from 'lucide-react';

export const WORTFELD_ICON_COMPONENTS = {
  AlarmClock, AlarmClockOff, AlertCircle, AppWindow, Armchair, ArrowLeftRight, AtSign, Baby,
  Backpack, BedDouble, Beer, Book, BookMarked, BookOpen, Briefcase, Building, Building2, Bus, Cake,
  CakeSlice, CalendarClock, CalendarDays, Car, ChefHat, Clock, Coffee, Computer, Contact,
  Croissant, CupSoda, DoorClosed, DoorOpen, Euro, FileSignature, FileText, Film, Flag, Gift,
  GlassWater, Globe, Goal, GraduationCap, Hand, Hash, Headphones, Heart, HelpCircle, Home,
  Hourglass, Image: ImageIcon, Key, Lamp, Languages, LayoutGrid, Mailbox, MapPin, MessageCircle,
  Moon, MoveRight, Music2, Newspaper, Palette, PartyPopper, PenLine, Pencil, Phone, PhoneCall, Play,
  Radio, Ruler, Salad, School, Scissors, Send, ShoppingBag, ShoppingCart, ShowerHead, Smartphone,
  Smile, Soup, Sparkle, Stethoscope, Store, Sun, Sunrise, Sunset, Table2, Tag, ThumbsUp, Ticket,
  TrainFront, Type, User, Users, Utensils, UtensilsCrossed, Waves, Wine, Zap,
};
