
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Landing } from './components/Landing';
import { ReportForm } from './components/ReportForm';
import { TicketList } from './components/TicketList';
import { InventoryManager } from './components/InventoryManager';
import { MaritimeManager } from './components/MaritimeManager';
import { MeetingReportManager } from './components/MeetingReportManager';
import { BackupManager } from './components/BackupManager';
import { Sathorn3D } from './components/Sathorn3D';
import { AssetTracker } from './components/AssetTracker';
import { TicketMachineManager } from './components/TicketMachineManager';
import { MediaMap } from './components/MediaMap';
import { SimAisManager } from './components/SimAisManager';
import { CalendarManager } from './components/CalendarManager';
import { SaveIndicator } from './components/SaveIndicator';
import { Activity } from 'lucide-react';
import { safeSetItem, STORAGE_KEYS, checkStorageQuota } from './utils/storageUtils';
import { fetchAllData, saveAllData, AppData } from './services/syncService';

import { AppMode, MaintenanceTicket, StockItem, MaritimeItem, TrackedAsset, MeetingReport, ProcurementFolder, InventorySelection, SimCard, TicketMachine } from './types';

// Mock initial data
const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: '1',
    deviceType: 'TICKET_MACHINE',
    deviceId: 'TM-004',
    issueDescription: 'หน้าจอกระพริบและระบบสัมผัสไม่ทำงาน',
    location: 'สถานีกลาง ประตู 2',
    status: 'IN_PROGRESS',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    imageUrls: [],
    aiAnalysis: {
      severity: 'MEDIUM',
      suggestedAction: 'ตรวจสอบสายสัญญาณจอภาพ',
      technicalNotes: 'น่าจะเป็นที่สาย LVDS หลวมหรือพาเนลจอเสีย'
    }
  }
];

const INITIAL_STOCK: StockItem[] = [
  {
    id: 's1',
    name: 'สายชาร์จ Type-C',
    category: 'Cables',
    quantity: 25,
    minThreshold: 10,
    unit: 'เส้น',
    status: 'IN_STOCK',
    lastPurchaseDate: '2023-10-15',
  }
];

const INITIAL_TRACKED_ASSETS: TrackedAsset[] = [
  {
    id: 't1',
    sn: 'SN-CB-001',
    name: 'สายชาร์จ Type-C (Fast)',
    location: 'ท่าสะพานพุทธ',
    locationType: 'PORT',
    username: 'สมชาย ไอที',
    installedDate: '2023-10-20'
  }
];

const INITIAL_MARITIME: MaritimeItem[] = [
  {
    id: 'm_pier_sathorn',
    name: 'Sathorn Pier (ท่าเรือสาทร)',
    type: 'PORT',
    location: 'แม่น้ำเจ้าพระยา (Sathorn)',
    status: 'NORMAL',
    recordDate: '2025-12-22',
    images: []
  }
];

const INITIAL_REPORTS: MeetingReport[] = [
  {
    id: 'r1',
    title: 'สรุปงานซ่อมบำรุงประจำเดือน ม.ค.',
    date: '2025-01-25',
    activities: [
      {
        id: 'a1',
        type: 'REPAIR',
        date: '2025-01-10',
        deviceName: 'CCTV Camera 04',
        location: 'ท่าเรือสาทร',
        owner: 'ช่างเทคนิค A',
        details: 'เปลี่ยน Adapter จ่ายไฟใหม่ เนื่องจากของเดิมช็อต',
        beforeImages: [], // In real app, these would be URLs
        afterImages: []
      }
    ]
  }
];

const INITIAL_PROCUREMENT_FOLDERS: ProcurementFolder[] = [
  {
    id: 'folder1',
    name: 'สำนักงาน_มกราคม_2026',
    locationType: 'OFFICE',
    locationName: 'สำนักงาน',
    year: 2026,
    month: 0,
    items: [
      {
        id: 'item1',
        name: 'สายแลน CAT6 100m',
        quantity: 5,
        unit: 'กล่อง',
        purchaseDate: '2026-01-15',
        usageStatus: 'ACTIVE',
        supplier: 'Advice IT',
        notes: 'สำหรับเดินระบบชั้น 2'
      },
      {
        id: 'item2',
        name: 'กล้อง CCTV 4K',
        quantity: 2,
        unit: 'ตัว',
        purchaseDate: '2026-01-18',
        usageStatus: 'ACTIVE',
        supplier: 'Hikvision Thailand',
        notes: 'ติดตั้งจุดทางเข้าหลัก'
      },
      {
        id: 'item3',
        name: 'เครื่องสำรองไฟ 1000VA',
        quantity: 1,
        unit: 'เครื่อง',
        purchaseDate: '2026-01-10',
        usageStatus: 'SPARE',
        supplier: 'JIB Computer',
        notes: 'สำรองสำหรับ Server Room'
      }
    ]
  },
  {
    id: 'folder2',
    name: 'ท่าเรือสาทร_มกราคม_2026',
    locationType: 'PIER',
    locationName: 'สาทร',
    year: 2026,
    month: 0,
    items: [
      {
        id: 'item4',
        name: 'กระดาษความร้อน 80x80',
        quantity: 50,
        unit: 'ม้วน',
        purchaseDate: '2026-01-05',
        usageStatus: 'ACTIVE',
        supplier: 'OfficeMate',
        notes: 'สำหรับตู้จำหน่ายตั๋ว'
      }
    ]
  }
];

const INITIAL_SIM_CARDS: SimCard[] = [
  { id: 'sim1', phoneNumber: '0863314208', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'อารยพันธ์', provider: 'AIS' },
  { id: 'sim2', phoneNumber: '0935812758', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'ไอคอนสยาม', notes: 'สาวิกา', provider: 'AIS' },
  { id: 'sim3', phoneNumber: '0935812636', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'สาทร Center', provider: 'AIS' },
  { id: 'sim4', phoneNumber: '0935812644', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'ราชวงศ์', notes: 'อรอนงค์', provider: 'AIS' },
  { id: 'sim5', phoneNumber: '0935812768', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'ราชินี', notes: 'ดวงใจ', provider: 'AIS' },
  { id: 'sim6', phoneNumber: '0935812678', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'ท่าช้าง', notes: 'วาริษนันท์', provider: 'AIS' },
  { id: 'sim7', phoneNumber: '0935812711', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'มหาราช', notes: 'กรกนก', provider: 'AIS' },
  { id: 'sim8', phoneNumber: '0935812762', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พรานนก', notes: 'ทิพยา', provider: 'AIS' },
  { id: 'sim9', phoneNumber: '0935812813', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พรานนก', notes: 'สุนีย์', provider: 'AIS' },
  { id: 'sim10', phoneNumber: '0935812834', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พระอาทิตย์', notes: 'กนกพรรณ', provider: 'AIS' },
  { id: 'sim11', phoneNumber: '0935812715', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB1', notes: 'วาสนา (Famoco)', provider: 'AIS' },
  { id: 'sim12', phoneNumber: '0935812740', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB2', notes: 'จันทร์เพ็ญ (Famoco)', provider: 'AIS' },
  { id: 'sim13', phoneNumber: '0935812741', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB3', notes: 'อุไร (Famoco)', provider: 'AIS' },
  { id: 'sim14', phoneNumber: '0935812660', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'R2', notes: 'ธนพร (Famoco)', provider: 'AIS' },
  { id: 'sim15', phoneNumber: '0935812488', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB1', notes: 'สุดารัตน์ (Viabus)', provider: 'AIS' },
  { id: 'sim16', phoneNumber: '0935812501', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB2', notes: 'เขม (Viabus)', provider: 'AIS' },
  { id: 'sim17', phoneNumber: '0935812508', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB3', notes: 'ภัทรานิษฐ์ (Viabus)', provider: 'AIS' },
  { id: 'sim18', phoneNumber: '0935812848', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'R3', notes: 'จิตรตินันท์ (Famoco)', provider: 'AIS' },
  { id: 'sim19', phoneNumber: '0935812866', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'R1', notes: 'ศิริรัตน์ (Famoco)', provider: 'AIS' },
  { id: 'sim20', phoneNumber: '0935812846', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'ทิพสุดา', provider: 'AIS' },
  { id: 'sim21', phoneNumber: '0935812514', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'มั้น การตลาด', notes: 'สุชาดา', provider: 'AIS' },
  { id: 'sim22', phoneNumber: '0935812885', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'R4', notes: 'นพวรรณ', provider: 'AIS' },
  { id: 'sim23', phoneNumber: '0935812921', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'CTB4', notes: 'ใช้งานไม่ได้', provider: 'AIS' },
  { id: 'sim24', phoneNumber: '0935812924', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'สำรอง', provider: 'AIS' },
  { id: 'sim25', phoneNumber: '0935812751', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'BTS', notes: 'Famoco', provider: 'AIS' },
  { id: 'sim26', phoneNumber: '0935812533', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'CCTV1', provider: 'AIS' },
  { id: 'sim27', phoneNumber: '0935812566', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'ไอคอนสยาม', notes: 'CCTV', provider: 'AIS' },
  { id: 'sim28', phoneNumber: '0935812576', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'วัดอรุณฯ', notes: 'CCTV', provider: 'AIS' },
  { id: 'sim29', phoneNumber: '0935812591', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'มหาราช', notes: 'กัญญาลักษณ์', provider: 'AIS' },
  { id: 'sim30', phoneNumber: '0935812601', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'วารีรัตน์', provider: 'AIS' },
  { id: 'sim31', phoneNumber: '0935812635', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พระอาทิตย์', notes: 'อาทิตยา', provider: 'AIS' },
  { id: 'sim32', phoneNumber: '0631270929', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'เจน แอดมิน', notes: 'ศรีวรรณ', provider: 'AIS' },
  { id: 'sim33', phoneNumber: '0935812987', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'Trip.com', provider: 'AIS' },
  { id: 'sim34', phoneNumber: '0935812971', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'BTS', notes: 'CCTV', provider: 'AIS' },
  { id: 'sim35', phoneNumber: '0655084269', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'สาทร', notes: 'CCTV2', provider: 'AIS' },
  { id: 'sim36', phoneNumber: '0659350297', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พระอาทิตย์', notes: 'CCTV', provider: 'AIS' },
  { id: 'sim37', phoneNumber: '0659350298', promotion: '129 ฿', deviceName: 'SIM AIS', status: 'ACTIVE', location: 'พระอาทิตย์', notes: 'KiosK', provider: 'AIS' }
];

const INITIAL_TICKET_MACHINES: TicketMachine[] = [
  { id: 'tm1', serialNumber: '(01)03770004396818(21)1W5G', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'IT' },
  { id: 'tm2', serialNumber: '(01)03770004396818(21)1W5R', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'พรานนก1' },
  { id: 'tm3', serialNumber: '(01)03770004396818(21)1W5S', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'พรานนก2' },
  { id: 'tm4', serialNumber: '(01)03770004396818(21)1W6X', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'มหาราช' },
  { id: 'tm5', serialNumber: '(01)03770004396818(21)1W71', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'ท่าช้าง' },
  { id: 'tm6', serialNumber: '(01)03770004396818(21)1W7B', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'ราชินี' },
  { id: 'tm7', serialNumber: '(01)03770004396818(21)1W8P', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'ราชวงศ์' },
  { id: 'tm8', serialNumber: '(01)03770004396818(21)1W94', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'ไอคอนสยาม' },
  { id: 'tm9', serialNumber: '(01)03770004396818(21)1W9U', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'สาทร1' },
  { id: 'tm10', serialNumber: '(01)03770004396818(21)1W9W', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'สาทร2' },
  { id: 'tm11', serialNumber: '(01)03770004396818(21)1WFI', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'BTS' },
  { id: 'tm12', serialNumber: '(01)03770004396818(21)1WH7', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'สาทร' },
  { id: 'tm13', serialNumber: '(01)03770004396818(21)1ZB4', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'CTB2' },
  { id: 'tm14', serialNumber: '(01)03770004396818(21)1Z6M', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'CTB3' },
  { id: 'tm15', serialNumber: '(01)03770004396818(21)1ZB6', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'IT' },
  { id: 'tm16', serialNumber: '(01)03770004396818(21)1ZC1', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'R1' },
  { id: 'tm17', serialNumber: '(01)03770004396818(21)1ZC4', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'R2' },
  { id: 'tm18', serialNumber: '(01)03770004396818(21)1Z4E', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'R3' },
  { id: 'tm19', serialNumber: '(01)03770004396818(21)1Z4F', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'R4' },
  { id: 'tm20', serialNumber: '(01)03770004396818(21)1Z4L', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'พระอาทิตย์' },
  { id: 'tm21', serialNumber: '(01)03770004396818(21)1Z40', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'มหาราช' },
  { id: 'tm22', serialNumber: '(01)03770004396818(21)1Z7O', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'CTB1' },
  { id: 'tm23', serialNumber: '(01)03770004396818(21)1Z4B', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'IT' },
  { id: 'tm24', serialNumber: '(01)03770004396818(21)1Z9U', purchaseDate: '2024-06-09', notes: 'ซื้อจาก BSS', deviceName: 'Famoco FX205', location: 'พระอาทิตย์' },
  { id: 'tm25', serialNumber: '1203556286', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'CTB1' },
  { id: 'tm26', serialNumber: '1203556287', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'CTB2' },
  { id: 'tm27', serialNumber: '1203556288', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'CTB3' },
  { id: 'tm28', serialNumber: '1203556289', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'R1' },
  { id: 'tm29', serialNumber: '1203556290', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'R2' },
  { id: 'tm30', serialNumber: '1203556291', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'R3' },
  { id: 'tm31', serialNumber: '1203556292', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'R4' },
  { id: 'tm32', serialNumber: '1203556293', purchaseDate: '2022-08-01', notes: 'ซื้อจาก BSS', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm33', serialNumber: '1305424112', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm34', serialNumber: '1305424113', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm35', serialNumber: '1305424114', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm36', serialNumber: '1305424115', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm37', serialNumber: '1305424116', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm38', serialNumber: '1305424117', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm39', serialNumber: '1305424118', purchaseDate: '2025-06-17', notes: 'เรือด่วน', deviceName: 'Mobile Printer PR-II', location: 'IT' },
  { id: 'tm40', serialNumber: '904521186596', purchaseDate: '2023-04-25', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'สาทร1' },
  { id: 'tm41', serialNumber: '904521186597', purchaseDate: '2023-04-25', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'สาทร2' },
  { id: 'tm42', serialNumber: '904521186598', purchaseDate: '2023-04-25', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'ไอคอนสยาม' },
  { id: 'tm43', serialNumber: '904521186599', purchaseDate: '2023-07-27', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'ราชวงศ์' },
  { id: 'tm44', serialNumber: '904521186628', purchaseDate: '2023-07-27', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'ราชินี' },
  { id: 'tm45', serialNumber: '904521186630', purchaseDate: '2023-07-27', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'ท่าช้าง' },
  { id: 'tm46', serialNumber: '904521186632', purchaseDate: '2023-07-27', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'มหาราช' },
  { id: 'tm47', serialNumber: '904521186633', purchaseDate: '2024-01-22', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'พรานนก1' },
  { id: 'tm48', serialNumber: '904521186634', purchaseDate: '2024-01-22', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'พรานนก2' },
  { id: 'tm49', serialNumber: '904521186635', purchaseDate: '2024-01-22', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'พระอาทิตย์' },
  { id: 'tm50', serialNumber: '904521186524', purchaseDate: '2024-01-22', notes: 'POSPAK', deviceName: 'Desktop Printer', location: 'BTS' },
  { id: 'tm51', serialNumber: 'R7AY4040F4B', purchaseDate: '2024-01-22', notes: 'Advice', deviceName: 'Samsung A06', location: 'CTB1' },
  { id: 'tm52', serialNumber: 'R8YY3097CJJ', purchaseDate: '2024-01-22', notes: 'Advice', deviceName: 'Samsung A06', location: 'CTB2' },
  { id: 'tm53', serialNumber: 'R4SD5204D6C', purchaseDate: '2024-01-22', notes: 'Advice', deviceName: 'Samsung A06', location: 'CTB3' },
  { id: 'tm54', serialNumber: 'R6KF1526F4S', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Samsung A06', location: 'สาทร' },
  { id: 'tm55', serialNumber: 'R7AY2068CAX', purchaseDate: '2025-10-02', notes: 'Advice', deviceName: 'Samsung A06', location: 'CTB1' },
  { id: 'tm56', serialNumber: 'R7AY2067XAY', purchaseDate: '2025-10-02', notes: 'Advice', deviceName: 'Samsung A06', location: 'CTB3' },
  { id: 'tm57', serialNumber: 'DB28FS68', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm58', serialNumber: 'HD52SK31', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm59', serialNumber: 'SH87SL17', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm60', serialNumber: 'DK81KF25', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm61', serialNumber: 'XU44OS60', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm62', serialNumber: 'PC45OI37', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'สาทร' },
  { id: 'tm63', serialNumber: 'TA59ZR45', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'ไอคอนสยาม' },
  { id: 'tm64', serialNumber: 'GK35MD94', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'ไอคอนสยาม' },
  { id: 'tm65', serialNumber: 'ES65DV87', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'ราชวงศ์' },
  { id: 'tm66', serialNumber: 'LX13CV98', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'ราชินี' },
  { id: 'tm67', serialNumber: 'PZ81AD03', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'วัดอรุณฯ' },
  { id: 'tm68', serialNumber: 'MX21DS32', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'วัดอรุณฯ' },
  { id: 'tm69', serialNumber: 'FS81DA07', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'ท่าช้าง' },
  { id: 'tm70', serialNumber: 'KD28UT31', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'มหาราช' },
  { id: 'tm71', serialNumber: 'LD50DA96', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'มหาราช' },
  { id: 'tm72', serialNumber: 'IU41SA60', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'มหาราช' },
  { id: 'tm73', serialNumber: 'XS12WF64', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'พรานนก' },
  { id: 'tm74', serialNumber: 'GD96GW05', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'IP Camera Ezviz', location: 'พรานนก' },
  { id: 'tm75', serialNumber: 'K45027932', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Ezviz H80x', location: 'พระอาทิตย์' },
  { id: 'tm76', serialNumber: 'BF7160805', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Ezviz H80x', location: 'พระอาทิตย์' },
  { id: 'tm77', serialNumber: 'BF7160893', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Ezviz H80x', location: 'พระอาทิตย์' },
  { id: 'tm78', serialNumber: 'BF7160934', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Ezviz H80x', location: 'พระอาทิตย์' },
  { id: 'tm79', serialNumber: 'W52D13689', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'สาทร' },
  { id: 'tm80', serialNumber: 'H93S59214', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'ไอคอนสยาม' },
  { id: 'tm81', serialNumber: 'P49Y05150', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'ราชวงศ์' },
  { id: 'tm82', serialNumber: 'K47R95177', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'ราชินี' },
  { id: 'tm83', serialNumber: 'M98Q2513', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'วัดอรุณฯ' },
  { id: 'tm84', serialNumber: 'OP52W965', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'ท่าช้าง' },
  { id: 'tm85', serialNumber: 'ID78B1126', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'มหาราช' },
  { id: 'tm86', serialNumber: 'LA87G6521', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'พรานนก' },
  { id: 'tm87', serialNumber: 'UY18A2325', purchaseDate: '2024-05-23', notes: 'Advice', deviceName: 'Router 4G', location: 'พระอาทิตย์' },
  { id: 'tm88', serialNumber: 'S912V3B000407', purchaseDate: '2025-08-20', notes: 'Advice', deviceName: 'Router 4G D-Link', location: 'พระอาทิตย์' },
  { id: 'tm89', serialNumber: '6711100430001', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'สาทร' },
  { id: 'tm90', serialNumber: '6711100430002', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'สาทร' },
  { id: 'tm91', serialNumber: '6711100430003', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'ราชวงศ์' },
  { id: 'tm92', serialNumber: '6711100430004', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'ราชินี' },
  { id: 'tm93', serialNumber: '6711100430005', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'ท่าช้าง' },
  { id: 'tm94', serialNumber: '6711100430006', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'ท่าช้าง' },
  { id: 'tm95', serialNumber: '6711100430007', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'มหาราช' },
  { id: 'tm96', serialNumber: '6711100430008', purchaseDate: '2025-04-10', notes: 'HITOP', deviceName: 'Kiosk', location: 'พรานนก' },
  { id: 'tm97', serialNumber: 'AAC1981031COZD', purchaseDate: '2025-08-08', notes: 'บ้านหม้อ', deviceName: 'Boby Camera', location: 'นายตรวจเด' },
  { id: 'tm98', serialNumber: 'AAC1980356KSLU', purchaseDate: '2025-08-08', notes: 'บ้านหม้อ', deviceName: 'Boby Camera', location: 'นายตรวจต้อม' },
  { id: 'tm99', serialNumber: 'AAC1546619UIGC', purchaseDate: '2025-08-08', notes: 'บ้านหม้อ', deviceName: 'Boby Camera', location: 'นายตรวจเบน' },
  { id: 'tm100', serialNumber: 'AAC1980948WBOS', purchaseDate: '2025-08-08', notes: 'บ้านหม้อ', deviceName: 'Boby Camera', location: 'นายตรวจต๋อ' },
  { id: 'tm101', serialNumber: '10025498424', purchaseDate: '2025-08-25', notes: 'Advice', deviceName: 'MONITOR 21.5', location: 'CTB1' },
  { id: 'tm102', serialNumber: '10025422635', purchaseDate: '2025-08-05', notes: 'Advice', deviceName: 'MONITOR 21.5', location: 'CTB3' },
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');
  const [targetedAssetSn, setTargetedAssetSn] = useState<string | null>(null);
  const [inventorySelection, setInventorySelection] = useState<InventorySelection | null>(null);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);

  // Save indicator state
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const prevTicketsCountRef = React.useRef<number>(0);

  // State initialization
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('techfix_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('techfix_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK;
  });

  const [trackedAssets, setTrackedAssets] = useState<TrackedAsset[]>(() => {
    const saved = localStorage.getItem('techfix_tracked_assets');
    return saved ? JSON.parse(saved) : INITIAL_TRACKED_ASSETS;
  });

  const [maritimeItems, setMaritimeItems] = useState<MaritimeItem[]>(() => {
    const saved = localStorage.getItem('techfix_maritime');
    return saved ? JSON.parse(saved) : INITIAL_MARITIME;
  });

  const [meetingReports, setMeetingReports] = useState<MeetingReport[]>(() => {
    const saved = localStorage.getItem('techfix_meeting_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [procurementFolders, setProcurementFolders] = useState<ProcurementFolder[]>(() => {
    const saved = localStorage.getItem('techfix_procurement_folders');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy folders and use defaults if empty
      if (parsed.length === 0) return INITIAL_PROCUREMENT_FOLDERS;
      return parsed.map((folder: any) => ({
        ...folder,
        month: folder.month !== undefined ? folder.month : 0
      }));
    }
    return INITIAL_PROCUREMENT_FOLDERS;
  });

  const [simCards, setSimCards] = useState<SimCard[]>(() => {
    const saved = localStorage.getItem('techfix_sim_cards');
    return saved ? JSON.parse(saved) : INITIAL_SIM_CARDS;
  });

  const [ticketMachines, setTicketMachines] = useState<TicketMachine[]>(() => {
    const saved = localStorage.getItem('techfix_ticket_machines');
    return saved ? JSON.parse(saved) : INITIAL_TICKET_MACHINES;
  });

  const syncWithGoogleSheetsDirect = async () => {
    try {
      const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1M6f-xHA9E0mqdTbvIFkROLbL4d6gJaC0JC8QRhHYmh0/export?format=csv&gid=2077750642';
      const response = await fetch(SHEET_CSV_URL);
      if (!response.ok) return [];
      const csv = await response.text();
      const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length <= 1) return [];

      const newTickets: MaintenanceTicket[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, ''));
        const [timestamp, reporter, message, , , , rawStatus] = parts;
        if (!message || !reporter) continue;
        
        let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
        if (rawStatus) {
          if (rawStatus.includes('กำลังแก้ไข')) status = 'IN_PROGRESS';
          else if (rawStatus.includes('เสร็จ') || rawStatus.includes('เรียบร้อย')) status = 'COMPLETED';
        }

        newTickets.push({
          id: `sheet_direct_${reporter}_${i}`, // Using a stable ID base if possible
          deviceType: 'EXTERNAL',
          deviceId: 'SHEET_FORM',
          issueDescription: message,
          contactName: reporter,
          status,
          timestamp: new Date(timestamp || Date.now()).toISOString(),
          location: 'แจ้งผ่าน Google Form',
          // We can attach the raw status if needed, but standard status is fine
        });
      }
      return newTickets;
    } catch (e) {
      return [];
    }
  };

  // 🔄 Initial Sync from Backend (Render)
  const syncFromBackend = useCallback(async (isPolling = false) => {
    const remoteData = await fetchAllData();
    const sheetTickets = await syncWithGoogleSheetsDirect();

    setTickets(prevTickets => {
      const remoteTickets = remoteData?.tickets || [];
      let combinedTickets = [...prevTickets];
      let changesDetected = 0;
      
      // 1. Update from remote backend data
      remoteTickets.forEach(rt => {
        const idx = combinedTickets.findIndex(t => t.id === rt.id);
        if (idx >= 0) {
          if (combinedTickets[idx].status !== rt.status) {
            combinedTickets[idx] = { ...combinedTickets[idx], ...rt };
            changesDetected++;
          }
        } else {
          combinedTickets = [rt, ...combinedTickets];
          changesDetected++;
        }
      });

      // 2. Merge sheet tickets
      sheetTickets.forEach(st => {
        const existingIndex = combinedTickets.findIndex(t => 
          t.issueDescription === st.issueDescription && t.contactName === st.contactName
        );
        
        if (existingIndex >= 0) {
          // Check if status changed
          if (combinedTickets[existingIndex].status !== st.status && combinedTickets[existingIndex].deviceId === 'SHEET_FORM') {
            combinedTickets[existingIndex] = { ...combinedTickets[existingIndex], status: st.status };
            changesDetected++;
          }
        } else {
          // New ticket from sheet
          combinedTickets = [st, ...combinedTickets];
          changesDetected++;
        }
      });

      const currentCount = prevTickets.length;
      if (changesDetected > 0 && currentCount > 0) {
        setNewTicketsCount(prev => prev + changesDetected);
      }
      
      return combinedTickets;
    });

    if (remoteData) {
      if (remoteData.stock?.length) setStockItems(remoteData.stock);
      if (remoteData.assets?.length) setTrackedAssets(remoteData.assets);
      if (remoteData.maritime?.length) setMaritimeItems(remoteData.maritime);
      if (remoteData.reports?.length) setMeetingReports(remoteData.reports);
      if (remoteData.folders?.length) setProcurementFolders(remoteData.folders);
      if (remoteData.simCards?.length) setSimCards(remoteData.simCards);
      if (remoteData.ticketMachines?.length) setTicketMachines(remoteData.ticketMachines);
      
      if (!isPolling) console.log('✅ Backend + Sheet Data Sync Complete');
    }
  }, []);

  useEffect(() => {
    // Initial sync
    syncFromBackend();

    // Set up polling every 15 seconds
    const pollInterval = setInterval(() => {
      syncFromBackend(true);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [syncFromBackend]);

  // Persistence with error handling and save indicator
  useEffect(() => {
    const saveData = async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        // 1. Save to LocalStorage (for offline cache)
        const results = [
          safeSetItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets)),
          safeSetItem(STORAGE_KEYS.STOCK, JSON.stringify(stockItems)),
          safeSetItem(STORAGE_KEYS.TRACKED_ASSETS, JSON.stringify(trackedAssets)),
          safeSetItem(STORAGE_KEYS.MARITIME, JSON.stringify(maritimeItems)),
          safeSetItem(STORAGE_KEYS.MEETING_REPORTS, JSON.stringify(meetingReports)),
          safeSetItem(STORAGE_KEYS.PROCUREMENT_FOLDERS, JSON.stringify(procurementFolders)),
          safeSetItem(STORAGE_KEYS.SIM_CARDS, JSON.stringify(simCards)),
          safeSetItem(STORAGE_KEYS.TICKET_MACHINES, JSON.stringify(ticketMachines)),
        ];

        // 2. Save to Backend (Render) - Expanded Storage
        const appData: AppData = {
          tickets,
          stock: stockItems,
          assets: trackedAssets,
          maritime: maritimeItems,
          reports: meetingReports,
          folders: procurementFolders,
          simCards,
          ticketMachines
        };
        const backendSuccess = await saveAllData(appData);

        // Check for any errors
        const errors = results.filter(r => !r.success);
        if (errors.length > 0 && !backendSuccess) {
          setSaveError(errors[0].error || 'เกิดข้อผิดพลาดในการบันทึก');
          console.error('Storage errors:', errors);
        } else {
          setLastSavedTime(new Date());
        }

        // Check storage quota
        const quotaInfo = await checkStorageQuota();
        if (quotaInfo.isNearFull) {
          console.warn('Storage is near full:', quotaInfo);
        }
      } catch (error) {
        console.error('Failed to save data:', error);
        setSaveError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saving to avoid too frequent writes
    const timeoutId = setTimeout(saveData, 300);
    return () => clearTimeout(timeoutId);
  }, [tickets, stockItems, trackedAssets, maritimeItems, meetingReports, procurementFolders, simCards, ticketMachines]);

  // Handlers
  const handleNavigate = (newMode: AppMode, filter: string = 'ALL') => {
    setTicketFilter(filter);
    setMode(newMode);
    setEditingTicket(null); // Clear editing state on navigation
    if (newMode !== 'ASSET_TRACKING') setTargetedAssetSn(null);
  };

  const handleEditTicket = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setMode('REPORT');
  };

  const handleTicketSubmit = (ticketData: Omit<MaintenanceTicket, 'id' | 'status'>, editId?: string) => {
    if (editId) {
      setTickets(tickets.map(t => t.id === editId ? { ...t, ...ticketData } : t));
      setEditingTicket(null);
    } else {
      const newTicket: MaintenanceTicket = {
        ...ticketData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING',
        timestamp: ticketData.timestamp || new Date().toISOString(),
      };
      setTickets([newTicket, ...tickets]);
    }
    handleNavigate('TRACK', 'ALL');
  };

  const handleBatchDateUpdate = (ticketIds: string[], newDateStr: string) => {
    const [y, m, d] = newDateStr.split('-').map(Number);
    setTickets(prevTickets => prevTickets.map(t => {
      if (ticketIds.includes(t.id)) {
        const oldDate = new Date(t.timestamp);
        const newDate = new Date(oldDate);
        newDate.setFullYear(y);
        newDate.setMonth(m - 1);
        newDate.setDate(d);
        return { ...t, timestamp: newDate.toISOString() };
      }
      return t;
    }));
  };

  const handleLocateAsset = (sn: string) => {
    const asset = trackedAssets.find(a => a.sn === sn);
    if (asset) {
      setTargetedAssetSn(asset.id);
      setMode('ASSET_TRACKING');
    }
  };

  const handleStockToAsset = (item: StockItem) => {
    const newAsset: TrackedAsset = {
      id: Math.random().toString(36).substr(2, 9),
      sn: `STOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: item.name,
      location: 'คลังพัสดุ (Stock Room)',
      locationType: 'PORT',
      username: 'เจ้าหน้าที่คลัง',
      installedDate: item.lastPurchaseDate,
      status: 'SPARE',
      purchaseDate: item.lastPurchaseDate,
      price: item.pricePerUnit,
      source: item.supplier,
      model: item.category,
      notes: `Imported from Procurement. Qty: ${item.quantity}`
    };
    setTrackedAssets(prev => [newAsset, ...prev]);
    alert(`เพิ่มรายการ "${item.name}" เข้าสู่ระบบเช็คตำแหน่งแล้ว (Tracking ID: ${newAsset.sn})`);
  };

  const handleRestore = (data: any) => {
    if (data.tickets) setTickets(data.tickets);
    if (data.stock) setStockItems(data.stock);
    if (data.maritime) setMaritimeItems(data.maritime);
    if (data.trackedAssets) setTrackedAssets(data.trackedAssets);
    if (data.meetingReports) setMeetingReports(data.meetingReports);
    if (data.procurementFolders) setProcurementFolders(data.procurementFolders);
    if (data.simCards) setSimCards(data.simCards);
    if (data.ticketMachines) setTicketMachines(data.ticketMachines);
  };

  const handleNavigateToFolder = (folderId: string) => {
    const folder = procurementFolders.find(f => f.id === folderId);
    if (folder) {
      setInventorySelection({
        year: folder.year,
        category: folder.locationType,
        location: folder.locationName,
        month: folder.month
      });
      setMode('PROCUREMENT');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar
        currentMode={mode}
        onModeChange={(newMode) => handleNavigate(newMode, 'ALL')}
        badges={{
          TRACK: tickets.filter(t => t.status !== 'COMPLETED').length,
          ADMIN: tickets.filter(t => t.status !== 'COMPLETED').length,
        }}
      />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-slate-950 to-purple-900/10 pointer-events-none fixed" />

        <div className="relative z-10 h-full">
          {mode === 'HOME' && <Landing onNavigate={handleNavigate} tickets={tickets} assets={trackedAssets} procurementFolders={procurementFolders} onNavigateToFolder={handleNavigateToFolder} newTicketsCount={newTicketsCount} onClearNewTickets={() => setNewTicketsCount(0)} />}
          {mode === 'REPORT' && (
            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReportForm
                onSubmit={(data) => handleTicketSubmit(data, editingTicket?.id)}
                onCancel={() => handleNavigate('HOME')}
                initialData={editingTicket}
                newTicketsCount={newTicketsCount}
                onClearNewTickets={() => setNewTicketsCount(0)}
              />
            </div>
          )}
          {mode === 'TRACK' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, data) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  const newImages = Array.isArray(data) ? data : [data];
                  const existingImages = t.fixedImageUrls || (t.fixedImageUrl ? [t.fixedImageUrl] : []);
                  return {
                    ...t,
                    fixedImageUrls: [...existingImages, ...newImages],
                    fixedImageUrl: t.fixedImageUrl || newImages[0],
                    status: 'COMPLETED'
                  };
                }))}
                onEdit={handleEditTicket}
                onBatchDateUpdate={handleBatchDateUpdate}
              />
            </div>
          )}
          {mode === 'PROCUREMENT' && (
            <div className="py-8 animate-in fade-in duration-500">
              <InventoryManager
                folders={procurementFolders}
                onUpdate={setProcurementFolders}
                onNavigate={(m) => handleNavigate(m)}
                initialSelection={inventorySelection}
              />
            </div>
          )}
          {mode === 'ASSET_TRACKING' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketMachineManager 
                items={ticketMachines} 
                onUpdate={setTicketMachines}
                onReset={() => setTicketMachines(INITIAL_TICKET_MACHINES)}
              />
            </div>
          )}
          {mode === 'MARITIME' && (
            <div className="py-8 animate-in fade-in duration-500">
              <MaritimeManager items={maritimeItems} onUpdate={setMaritimeItems} />
            </div>
          )}
          {mode === 'MEETING_REPORT' && (
            <div className="py-8 animate-in fade-in duration-500">
              <MeetingReportManager reports={meetingReports} onUpdate={setMeetingReports} />
            </div>
          )}
          {mode === 'BACKUP' && (
            <div className="py-8 animate-in fade-in duration-500">
              <BackupManager onRestore={handleRestore} />
            </div>
          )}
          {mode === 'CALENDAR' && (
            <div className="py-8 animate-in fade-in duration-500">
              <CalendarManager tickets={tickets} procurementFolders={procurementFolders} />
            </div>
          )}
          {mode === 'SIM_AIS' && (
            <div className="py-8 animate-in fade-in duration-500">
              <SimAisManager items={simCards} onUpdate={setSimCards} />
            </div>
          )}
          {mode === 'ADMIN' && (
            <div className="py-8 animate-in fade-in duration-500">
              <TicketList
                tickets={tickets}
                isAdmin={true}
                onStatusUpdate={(id, status, completedDate) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  return {
                    ...t,
                    status,
                    completedDate: status === 'COMPLETED' ? (completedDate || new Date().toISOString().split('T')[0]) : t.completedDate
                  };
                }))}
                onDelete={(id) => setTickets(tickets.filter(t => t.id !== id))}
                initialFilter={ticketFilter}
                onFixedImageUpdate={(id, data) => setTickets(tickets.map(t => {
                  if (t.id !== id) return t;
                  const newImages = Array.isArray(data) ? data : [data];
                  const existingImages = t.fixedImageUrls || (t.fixedImageUrl ? [t.fixedImageUrl] : []);
                  return {
                    ...t,
                    fixedImageUrls: [...existingImages, ...newImages],
                    fixedImageUrl: t.fixedImageUrl || newImages[0],
                    status: 'COMPLETED',
                    completedDate: t.completedDate || new Date().toISOString().split('T')[0]
                  };
                }))}
                onEdit={handleEditTicket}
                onBatchDateUpdate={handleBatchDateUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <SaveIndicator lastSavedTime={lastSavedTime} isSaving={isSaving} />

      {/* Error Toast */}
      {saveError && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-red-950/90 border border-red-500/50 rounded-lg text-red-200 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{saveError}</span>
              <span className="text-[10px] text-red-400 mt-0.5 uppercase tracking-wider font-bold">โปรดไปที่เมนู Backup เพื่อจัดการพื้นที่</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-white transition-colors ml-2">✕</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
