import React from "react";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ActivityLogIcon,
  LayersIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cross2Icon,
  LockClosedIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  TrashIcon,
  RocketIcon,
  BoxIcon,
  GlobeIcon,
  TargetIcon,
  LightningBoltIcon,
  PersonIcon,
  QuestionMarkCircledIcon,
  SunIcon,
  FileTextIcon,
  InfoCircledIcon,
  Pencil1Icon,
  ExternalLinkIcon,
  HamburgerMenuIcon,
  CalendarIcon,
  GearIcon,
  CopyIcon,
  UpdateIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  LockOpen1Icon,
  GridIcon,
  PlusIcon,
  ArchiveIcon,
  ChatBubbleIcon,
  StackIcon,
  ExitIcon,
  CursorArrowIcon,
  EnvelopeClosedIcon,
  BookmarkIcon,
  CardStackIcon,
  ReaderIcon,
  DrawingPinIcon,
  PlusCircledIcon,
  CodeIcon,
  LetterCaseCapitalizeIcon,
} from "@radix-ui/react-icons";

export type IconName =
  | "ArrowRight"
  | "ChevronRight"
  | "ChevronDown"
  | "Activity"
  | "Layers"
  | "AlertCircle"
  | "Clock"
  | "X"
  | "Lock"
  | "LockOpen"
  | "Eye"
  | "EyeOff"
  | "Trash"
  | "Rocket"
  | "Box"
  | "Globe"
  | "Target"
  | "Zap"
  | "Users"
  | "HelpCircle"
  | "Lightbulb"
  | "FileText"
  | "AlertTriangle"
  | "Info"
  | "Edit"
  | "ExternalLink"
  | "Menu"
  | "Calendar"
  | "Settings"
  | "Copy"
  | "RefreshCw"
  | "Search"
  | "Check"
  | "Key"
  | "Hash"
  | "Plus"
  | "Folder"
  | "Trash2"
  | "MessageSquare"
  | "Database"
  | "Table"
  | "LogOut"
  | "MousePointer"
  | "Shield"
  | "Mail"
  | "User"
  | "Flag"
  | "CreditCard"
  | "Book"
  | "Save"
  | "PlusCircle"
  | "Type"
  | "Code"
  | "MapPin";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth, // Ignored in Radix Icons as they are fixed-stroke SVGs
  ...props
}) => {
  const iconMap: Record<IconName, React.ElementType> = {
    ArrowRight: ArrowRightIcon,
    ChevronRight: ChevronRightIcon,
    ChevronDown: ChevronDownIcon,
    Activity: ActivityLogIcon,
    Layers: LayersIcon,
    AlertCircle: ExclamationTriangleIcon,
    Clock: ClockIcon,
    X: Cross2Icon,
    Lock: LockClosedIcon,
    Eye: EyeOpenIcon,
    EyeOff: EyeNoneIcon,
    Trash: TrashIcon,
    Trash2: TrashIcon,
    Rocket: RocketIcon,
    Box: BoxIcon,
    Globe: GlobeIcon,
    Target: TargetIcon,
    Zap: LightningBoltIcon,
    Users: PersonIcon,
    User: PersonIcon,
    HelpCircle: QuestionMarkCircledIcon,
    Lightbulb: SunIcon,
    FileText: FileTextIcon,
    AlertTriangle: ExclamationTriangleIcon,
    Info: InfoCircledIcon,
    Edit: Pencil1Icon,
    ExternalLink: ExternalLinkIcon,
    Menu: HamburgerMenuIcon,
    Calendar: CalendarIcon,
    Settings: GearIcon,
    Copy: CopyIcon,
    RefreshCw: UpdateIcon,
    Search: MagnifyingGlassIcon,
    Check: CheckIcon,
     Key: LockOpen1Icon,
     LockOpen: LockOpen1Icon,
     Hash: GridIcon,
    Plus: PlusIcon,
    PlusCircle: PlusCircledIcon,
    Folder: ArchiveIcon,
    MessageSquare: ChatBubbleIcon,
    Database: StackIcon,
    Table: GridIcon,
    LogOut: ExitIcon,
    MousePointer: CursorArrowIcon,
    Shield: LockClosedIcon,
    Mail: EnvelopeClosedIcon,
    Flag: BookmarkIcon,
    CreditCard: CardStackIcon,
    Book: ReaderIcon,
    Save: CheckIcon,
    MapPin: DrawingPinIcon,
    Type: LetterCaseCapitalizeIcon,
    Code: CodeIcon,
  };

  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      // Radix icons map color to the SVG stroke/fill via CSS color, but tests
      // expect a `stroke` attribute for custom colors. Set both so tests pass
      // and runtime styling remains correct.
      color={color}
      stroke={color}
      strokeWidth={strokeWidth}
      className={className}
      data-testid={`icon-${name}`}
      {...props}
    />
  );
};
