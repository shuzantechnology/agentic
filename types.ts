
export enum ConnectionType {
  Business = 'Business',
  Residential = 'Residential'
}

export enum Priority {
  Critical = 'Critical/ Medical Dependency',
  Normal = 'Normal'
}

export interface TicketRequest {
  serviceId: string;
  requesterEmail: string;
  customerName: string;
  address: string;
  mobileNumber: string;
  issueReported: string;
  connectionType: ConnectionType;
  priority: Priority;
}

export interface Ticket extends TicketRequest {
  id: number;
  status: 'Open' | 'Resolved' | 'On Hold' | 'CSC Assigned' | 'Field WO Created';
  createdAt: string;
  woNumber?: string;
}

export interface OnHoldTicket {
  ticketNumber: string;
  serviceId: string;
}

export interface PlannedOutage {
  coName: string;
  oltName: string;
  ltCard: string;
  ponPort: string;
  cabinetId: string;
  serviceIds: string[];
  startTime: string; 
  endTime: string;
  ref: string;
}

export interface AltiplanoCheck {
  serviceId: string;
  ontSerial: string;
  macAddress: string[];
  rxPower: string;
  svlan: string;
  cvlan: string;
  port: string;
  status: 'good' | 'bad';
  opticalRange: string;
}

export interface IBSSRecord {
  serviceId: string;
  rfsDate: string;
  requestType: 'New Connection' | 'Terminate' | 'Modify';
  status: 'Closed' | 'Approved' | 'Open' | 'Pending';
}

export interface UnplannedOutage {
  serviceId: string;
  outageRef: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: 'CSV' | 'PIR' | 'ANALYSIS';
  data: string; // CSV content or Markdown for PIR
  timestamp: string;
}
