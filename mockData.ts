
import { 
  OnHoldTicket, 
  PlannedOutage, 
  AltiplanoCheck, 
  IBSSRecord,
  UnplannedOutage
} from './types';

// Virtual: On-hold tickets.csv
// Source: JSON block 3
export const ON_HOLD_TICKETS: OnHoldTicket[] = [
  { ticketNumber: '1600001', serviceId: 'ENXYZB02123456' },
  { ticketNumber: '1600002', serviceId: 'ENXYZB02123457' }
];

// Virtual: Outages.csv (Unplanned)
// Source: JSON block 4
export const UNPLANNED_OUTAGES: UnplannedOutage[] = [
  { serviceId: 'ENXYZB02123462', outageRef: 'UNP-MAJOR-CUT' }
];

// Virtual: Planned_outages.csv
// Source: JSON block 5
// 1770336061000 -> 2026-02-06T00:01:01Z
// 1801958341000 -> 2027-02-06T07:59:01Z
export const PLANNED_OUTAGES: PlannedOutage[] = [
  {
    coName: 'Central',
    oltName: 'ENACENOLT101',
    ltCard: '5',
    ponPort: '12',
    cabinetId: 'CN777',
    serviceIds: ['ENXYZB02123458'],
    startTime: new Date(1770336061000).toISOString(),
    endTime: new Date(1801958341000).toISOString(),
    ref: '1500123'
  },
  {
    coName: 'Central',
    oltName: 'ENACENOLT102',
    ltCard: '5',
    ponPort: '12',
    cabinetId: 'CN778',
    serviceIds: ['ENXYZB02123459'],
    startTime: new Date(1770249661000).toISOString(),
    endTime: new Date(1770336061000).toISOString(),
    ref: '1500124'
  }
];

// Virtual: Altiplano_checks.csv
// Source: JSON block 1
// Rules: rx power < -28 or MAC address 0/"0" triggers 'bad' status
export const ALTIPLANO_CHECKS: AltiplanoCheck[] = [
  { serviceId: 'ENXYZB02123456', ontSerial: 'HWTC12345678', macAddress: ['b0:89:00:f1:a7:48'], rxPower: '-16.1', svlan: '11', cvlan: '22', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123457', ontSerial: 'HWTC12345679', macAddress: ['b0:89:00:f1:a7:49'], rxPower: '-16.1', svlan: '12', cvlan: '23', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123458', ontSerial: 'HWTC12345680', macAddress: ['b0:89:00:f1:a7:50'], rxPower: '-16.1', svlan: '13', cvlan: '24', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123459', ontSerial: 'HWTC12345681', macAddress: ['b0:89:00:f1:a7:51'], rxPower: '-16.1', svlan: '14', cvlan: '25', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123460', ontSerial: 'HWTC12345682', macAddress: ['b0:89:00:f1:a7:52'], rxPower: '-16.1', svlan: '15', cvlan: '26', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123461', ontSerial: 'HWTC12345683', macAddress: [], rxPower: '-31.0', svlan: '16', cvlan: '27', port: 'eth 1', status: 'bad', opticalRange: 'Low Power - Fiber Cut' },
  { serviceId: 'ENXYZB02123462', ontSerial: 'HWTC12345684', macAddress: ['b0:89:00:f1:a7:54'], rxPower: '-16.1', svlan: '17', cvlan: '28', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123463', ontSerial: 'HWTC12345685', macAddress: ['b0:89:00:f1:a7:55'], rxPower: '-16.1', svlan: '18', cvlan: '29', port: 'eth 1', status: 'good', opticalRange: 'Within Allowed Range' },
  { serviceId: 'ENXYZB02123464', ontSerial: 'HWTC12345686', macAddress: [], rxPower: '-16.1', svlan: '19', cvlan: '30', port: 'eth 1', status: 'bad', opticalRange: 'No MAC Detected' }
];

// Virtual: IBSS.csv
// Source: JSON block 2
export const IBSS_RECORDS: IBSSRecord[] = [
  {
    serviceId: 'ENXYZB02123463',
    rfsDate: new Date(1707264000000).toISOString().split('T')[0],
    requestType: 'Terminate',
    status: 'Closed'
  },
  {
    serviceId: 'ENXYZB02123464',
    rfsDate: new Date(1801958400000).toISOString().split('T')[0],
    requestType: 'New Connection',
    status: 'Closed'
  }
];

export const CO_NAMES = [
  "Central", "Rolleston", "St. Albans", "Hornby", "Burwood", 
  "Riccarton", "Lincoln", "Leeston", "Rangiora", "Halswell", 
  "Mount Pleasant", "Kaiapoi", "Redwood", "West Milton", "Papanui"
];

export const RSPS = [
  { name: 'Mercury', id: 'TPR' },
  { name: 'Call Plus', id: 'CPL' },
  { name: 'Spark', id: 'TNZ' },
  { name: 'Devoli', id: 'VIB' },
  { name: 'Skinny-Fixed', id: 'SKF' },
  { name: 'Two Degrees', id: 'SNB' },
  { name: 'Vodafone', id: 'VNZ' },
  { name: 'NOW NZ', id: 'NOW' },
  { name: 'SKY', id: 'SKY' }
];
