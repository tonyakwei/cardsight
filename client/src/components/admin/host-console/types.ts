import type {
  AdminCard,
  AdminMission,
  AdminShowtime,
} from "../../../api/admin";

export interface TabActionProps {
  actionLoading: string | null;
}

export interface CardTabProps extends TabActionProps {
  cards: AdminCard[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggleLock: (card: AdminCard) => void;
  onReset: (card: AdminCard) => void;
}

export interface MissionTabProps extends TabActionProps {
  missions: AdminMission[];
  onToggleLock: (m: AdminMission) => void;
}

export interface ShowtimeTabProps extends TabActionProps {
  showtimes: AdminShowtime[];
  onTrigger: (st: AdminShowtime) => void;
  onReset: (st: AdminShowtime) => void;
}
