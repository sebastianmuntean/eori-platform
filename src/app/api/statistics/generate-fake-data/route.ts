import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { 
  clients, 
  parishes, 
  invoices, 
  payments, 
  churchEvents, 
  contracts,
  products,
  fixedAssets,
  inventorySessions,
  inventoryItems,
  warehouses,
  stockMovements,
  documentRegistry,
  users
} from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateVerificationToken } from '@/lib/auth/tokens';
import { eq, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Constants for generation limits
const MAX_GENERATION_LIMIT = 1000;
const STOCK_MOVEMENT_PERCENTAGE = 0.7; // 70% of products get stock movements
const MISSING_ASSET_PROBABILITY = 0.02; // 2% chance for fixed assets to be missing in inventory
const INVENTARY_ITEM_LIMIT = 500; // Maximum items to fetch for inventory generation

// Romanian names and company names for generating fake data
const firstNames = [
  'Ion', 'Maria', 'Gheorghe', 'Elena', 'Vasile', 'Ana', 'Constantin', 'Ioana',
  'Mihai', 'Georgiana', 'Andrei', 'Andreea', 'Alexandru', 'Cristina', 'Doru',
  'Daniela', 'Florin', 'Monica', 'Radu', 'Gabriela', 'Cristian', 'Laura',
  'Adrian', 'Alina', 'Nicolae', 'Raluca', 'Lucian', 'Simona', 'Tudor', 'Carmen'
];

const lastNames = [
  'Popescu', 'Ionescu', 'Popa', 'Pop', 'Radu', 'Georgescu', 'Stan', 'Stoica',
  'Nicolae', 'Florea', 'Dumitru', 'Gheorghe', 'Constantinescu', 'Munteanu',
  'Diaconu', 'Dobre', 'Marinescu', 'Barbu', 'Nistor', 'Ene', 'Tudor', 'Ilie',
  'Moldovan', 'Toma', 'Dragomir', 'Oprea', 'Cristea', 'Mihai', 'Grigore', 'Stefan'
];

const companyNames = [
  'SC ABC SRL', 'SC XYZ SA', 'SC Delta Consulting', 'SC Omega Trade',
  'SC Beta Services', 'SC Gamma Production', 'SC Alpha Commerce',
  'SC Sigma Solutions', 'SC Phi Industries', 'SC Theta Enterprises',
  'SC Lambda Group', 'SC Mu Technologies', 'SC Nu Systems', 'SC Xi Solutions',
  'SC Omicron Services', 'SC Pi Trading', 'SC Rho Commerce', 'SC Tau Industries',
  'SC Upsilon Systems', 'SC Psi Technologies'
];

const cities = [
  'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova',
  'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești',
  'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Satu Mare', 'Botoșani'
];

const streets = [
  'Str. Unirii', 'Str. Victoriei', 'Bd. Independenței', 'Str. Republicii',
  'Calea Victoriei', 'Str. Mihai Eminescu', 'Str. Gheorghe Doja',
  'Str. Nicolae Bălcescu', 'Bd. Carol I', 'Str. Avram Iancu'
];

// Product generation constants
const PRODUCT_NAMES = [
  'Lumânări', 'Vin liturgic', 'Pâine pentru euharistie', 'Tămâie', 'Ulei sfânt',
  'Cărți religioase', 'Icoane', 'Cruce', 'Cădelniță', 'Potir',
  'Patenă', 'Cingătoare', 'Vestmânt liturgic', 'Covor bisericesc', 'Candelabru',
  'Lampă ulei', 'Călimară', 'Clopoțel', 'Sfeșnic', 'Evanghelie'
] as const;

const PRODUCT_CATEGORIES = ['pangar', 'material', 'service', 'fixed', 'other'] as const;
type ProductCategory = typeof PRODUCT_CATEGORIES[number];

const PRODUCT_UNITS = ['buc', 'kg', 'l', 'm', 'pachet'] as const;
const VAT_RATES = ['9', '19', '24'] as const;

// Fixed asset generation constants
const FIXED_ASSET_NAMES = [
  'Organ bisericesc', 'Clopot', 'Altar', 'Amvon', 'Iconostas',
  'Candelabru mare', 'Cruce procesională', 'Covor mare', 'Scaun episcopal',
  'Masă liturgică', 'Sticlărie', 'Lustră', 'Fereastră vitraliu', 'Ușă principală',
  'Podea', 'Tavan', 'Zidărie', 'Acoperiș', 'Turn bisericesc'
] as const;

const FIXED_ASSET_CATEGORIES = ['Mobilier', 'Construcție', 'Decorațiuni', 'Instrumente', 'Altele'] as const;
const FIXED_ASSET_LOCATIONS = ['Biserică principală', 'Capelă', 'Sala parohială', 'Depozit', 'Curte'] as const;
const FIXED_ASSET_STATUSES = ['active', 'active', 'active', 'inactive', 'damaged'] as const;
type FixedAssetStatus = typeof FIXED_ASSET_STATUSES[number];

// Warehouse constants
const DEFAULT_WAREHOUSE_CODE = 'DEP-001';
const DEFAULT_WAREHOUSE_NAME = 'Depozit Principal';

// Document registry generation constants
const DOCUMENT_SUBJECTS = [
  'Cerere de aprobare', 'Notificare', 'Raport activitate', 'Solicitare informații',
  'Răspuns la cerere', 'Aprobare proiect', 'Respingere cerere', 'Informare',
  'Decizie administrativă', 'Contract de prestări servicii', 'Factură', 'Chitanță',
  'Scrisoare oficială', 'Memorandum', 'Circulară', 'Hotărâre', 'Ordin de serviciu',
  'Raport financiar', 'Planificare activități', 'Evaluare proiect'
] as const;

const DOCUMENT_TYPES = ['incoming', 'outgoing', 'internal'] as const;
type DocumentType = typeof DOCUMENT_TYPES[number];

const DOCUMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
type DocumentPriority = typeof DOCUMENT_PRIORITIES[number];

const DOCUMENT_STATUSES = ['draft', 'registered', 'in_work', 'distributed', 'resolved', 'archived'] as const;
type DocumentStatus = typeof DOCUMENT_STATUSES[number];

interface GenerateFakeDataRequest {
  clients?: number;
  clientsCount?: number; // For direct clients generation
  suppliers?: number;
  invoices?: number;
  payments?: number;
  events?: number;
  contracts?: number;
  products?: number;
  pangarProducts?: number; // Products with category 'pangar'
  fixedAssets?: number;
  inventory?: number;
  documents?: number;
  users?: number;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCNP(): string {
  // Generate a simple fake CNP (not valid, just for testing)
  const year = randomInt(50, 99).toString();
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  const rest = String(randomInt(100000, 999999));
  return year + month + day + rest;
}

function generatePhone(): string {
  return `07${randomInt(10000000, 99999999)}`;
}

function generateEmail(firstName?: string, lastName?: string, companyName?: string): string {
  const base = companyName 
    ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
    : `${(firstName || '').toLowerCase()}${(lastName || '').toLowerCase()}`;
  return `${base}@example.com`;
}

function generateIBAN(): string {
  return `RO${randomInt(10, 99)}BANK${randomInt(1000000000000000, 9999999999999999)}`;
}

function generateDate(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function generateDateInFuture(days: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Ensures a warehouse exists for a given parish, creating one if needed
 * @param parishId - The parish ID
 * @param userId - The user ID creating the warehouse
 * @returns The warehouse ID or null if creation failed
 */
async function ensureWarehouseForParish(
  parishId: string,
  userId: string
): Promise<string | null> {
  try {
    // Check if warehouse already exists
    const existingWarehouses = await db
      .select({ id: warehouses.id })
      .from(warehouses)
      .where(eq(warehouses.parishId, parishId))
      .limit(1);

    if (existingWarehouses.length > 0) {
      return existingWarehouses[0].id as string;
    }

    // Create new warehouse
    try {
      const [newWarehouse] = await db
        .insert(warehouses)
        .values({
          parishId,
          code: DEFAULT_WAREHOUSE_CODE,
          name: DEFAULT_WAREHOUSE_NAME,
          type: 'general',
          isActive: true,
          createdBy: userId,
        })
        .returning({ id: warehouses.id });

      return newWarehouse?.id as string || null;
    } catch (error: any) {
      // If warehouse already exists (race condition), fetch it
      if (error.code === '23505') {
        const [existingWarehouse] = await db
          .select({ id: warehouses.id })
          .from(warehouses)
          .where(eq(warehouses.parishId, parishId))
          .limit(1);
        return existingWarehouse?.id as string || null;
      }
      throw error;
    }
  } catch (error: any) {
    logError(`Error ensuring warehouse for parish ${parishId}`, error);
    return null;
  }
}

/**
 * Ensures warehouses exist for all parishes in parallel
 * @param allParishes - Array of parish objects with id
 * @param userId - The user ID creating the warehouses
 * @returns Map of parishId to warehouseId
 */
async function ensureWarehousesForAllParishes(
  allParishes: { id: string }[],
  userId: string
): Promise<Map<string, string>> {
  const warehousesByParish = new Map<string, string>();
  
  // Create warehouses in parallel
  const warehousePromises = allParishes.map(async (parish) => {
    const warehouseId = await ensureWarehouseForParish(parish.id, userId);
    if (warehouseId) {
      warehousesByParish.set(parish.id, warehouseId);
    }
    return { parishId: parish.id, warehouseId };
  });

  await Promise.all(warehousePromises);
  return warehousesByParish;
}

/**
 * Generates a unique product code with timestamp to avoid duplicates
 * @param index - The index of the product
 * @returns Unique product code
 */
function generateUniqueProductCode(index: number): string {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `PROD-${timestamp}-${String(index + 1).padStart(6, '0')}`;
}

/**
 * Generates a unique inventory number with timestamp to avoid duplicates
 * @param index - The index of the fixed asset
 * @returns Unique inventory number
 */
function generateUniqueInventoryNumber(index: number): string {
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  return `INV-${timestamp}-${String(index + 1).padStart(6, '0')}`;
}

/**
 * Validates generation limits to prevent excessive data generation
 */
function validateGenerationLimits(request: GenerateFakeDataRequest): string | null {
  if (request.products && request.products > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} products can be generated at once`;
  }
  if (request.pangarProducts && request.pangarProducts > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} pangar products can be generated at once`;
  }
  if (request.fixedAssets && request.fixedAssets > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} fixed assets can be generated at once`;
  }
  if (request.inventory && request.inventory > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} inventory sessions can be generated at once`;
  }
  if (request.documents && request.documents > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} documents can be generated at once`;
  }
  if (request.users && request.users > MAX_GENERATION_LIMIT) {
    return `Maximum ${MAX_GENERATION_LIMIT} users can be generated at once`;
  }
  return null;
}

async function ensurePartnersExist(
  allParishes: { id: string }[],
  userId: string,
  minCount: number = 5
): Promise<number> {
  // Check existing clients
  const existingClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.isActive, true))
    .limit(1);

  if (existingClients.length > 0) {
    return 0; // Clients already exist
  }

  // Generate minimum required clients
  const clientsToCreate = [];
  const clientsNeeded = Math.ceil(minCount * 0.7);
  const suppliersNeeded = Math.ceil(minCount * 0.3);

  // Generate clients
  for (let i = 0; i < clientsNeeded; i++) {
    const type = Math.random() > 0.7 ? 'company' : 'person';
    const parishId = randomElement(allParishes).id as string;

    if (type === 'person') {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      clientsToCreate.push({
        parishId,
        code: `AUTO-CLI-${String(i + 1).padStart(4, '0')}`,
        firstName,
        lastName,
        cnp: generateCNP(),
        birthDate: `${randomInt(1950, 2000)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
        city: randomElement(cities),
        county: 'București',
        address: `${randomElement(streets)} ${randomInt(1, 200)}`,
        postalCode: `${randomInt(100000, 999999)}`,
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        iban: Math.random() > 0.5 ? generateIBAN() : null,
        isActive: true,
        createdBy: userId,
      });
    } else {
      const companyName = randomElement(companyNames);
      clientsToCreate.push({
        parishId,
        code: `AUTO-CLI-${String(i + 1).padStart(4, '0')}`,
        companyName,
        cui: `${randomInt(10000000, 99999999)}`,
        regCom: `J${randomInt(10, 52)}/${randomInt(1000, 9999)}/${randomInt(2000, 2024)}`,
        city: randomElement(cities),
        county: 'București',
        address: `${randomElement(streets)} ${randomInt(1, 200)}`,
        postalCode: `${randomInt(100000, 999999)}`,
        phone: generatePhone(),
        email: generateEmail(undefined, undefined, companyName),
        bankName: Math.random() > 0.5 ? 'Banca Transilvania' : 'BCR',
        iban: generateIBAN(),
        isActive: true,
        createdBy: userId,
      });
    }
  }

  // Generate suppliers
  for (let i = 0; i < suppliersNeeded; i++) {
    const type = Math.random() > 0.6 ? 'company' : 'person';
    const parishId = randomElement(allParishes).id as string;

    if (type === 'person') {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      clientsToCreate.push({
        parishId,
        code: `AUTO-SUP-${String(i + 1).padStart(4, '0')}`,
        firstName,
        lastName,
        cnp: generateCNP(),
        birthDate: `${randomInt(1950, 2000)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
        city: randomElement(cities),
        county: 'București',
        address: `${randomElement(streets)} ${randomInt(1, 200)}`,
        postalCode: `${randomInt(100000, 999999)}`,
        phone: generatePhone(),
        email: generateEmail(firstName, lastName),
        iban: Math.random() > 0.5 ? generateIBAN() : null,
        isActive: true,
        createdBy: userId,
      });
    } else {
      const companyName = randomElement(companyNames);
      clientsToCreate.push({
        parishId,
        code: `AUTO-SUP-${String(i + 1).padStart(4, '0')}`,
        companyName,
        cui: `${randomInt(10000000, 99999999)}`,
        regCom: `J${randomInt(10, 52)}/${randomInt(1000, 9999)}/${randomInt(2000, 2024)}`,
        city: randomElement(cities),
        county: 'București',
        address: `${randomElement(streets)} ${randomInt(1, 200)}`,
        postalCode: `${randomInt(100000, 999999)}`,
        phone: generatePhone(),
        email: generateEmail(undefined, undefined, companyName),
        bankName: Math.random() > 0.5 ? 'Banca Transilvania' : 'BCR',
        iban: generateIBAN(),
        isActive: true,
        createdBy: userId,
      });
    }
  }

  // Insert clients
  if (clientsToCreate.length > 0) {
    try {
      await db.insert(clients).values(clientsToCreate);
      return clientsToCreate.length;
    } catch (error: any) {
      logError('Error creating auto clients', error);
      throw error;
    }
  }

  return 0;
}

/**
 * POST /api/statistics/generate-fake-data - Generate fake data for testing
 */
export async function POST(request: Request) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: GenerateFakeDataRequest = await request.json();
    
    // Validate generation limits
    const validationError = validateGenerationLimits(body);
    if (validationError) {
      return NextResponse.json({
        success: false,
        error: validationError,
      }, { status: 400 });
    }

    const clientsCount = body.clients || 0;
    const directClientsCount = body.clientsCount || 0; // Direct clients generation
    const suppliersCount = body.suppliers || 0;
    const invoicesCount = body.invoices || 0;
    const paymentsCount = body.payments || 0;
    const eventsCount = body.events || 0;
    const contractsCount = body.contracts || 0;
    const productsCount = body.products || 0;
    const pangarProductsCount = body.pangarProducts || 0;
    const fixedAssetsCount = body.fixedAssets || 0;
    const inventoryCount = body.inventory || 0;
    const documentsCount = body.documents || 0;
    const usersCount = body.users || 0;

    // Get all active parishes
    const allParishes = await db
      .select({ id: parishes.id })
      .from(parishes)
      .where(eq(parishes.isActive, true));

    if (allParishes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active parishes found. Please create at least one parish first.',
      });
    }

    const results = {
      clients: 0,
      directClients: 0,
      suppliers: 0,
      invoices: 0,
      payments: 0,
      events: 0,
      contracts: 0,
      products: 0,
      pangarProducts: 0,
      fixedAssets: 0,
      inventory: 0,
      documents: 0,
      users: 0,
      errors: [] as string[],
    };

    // Generate clients
    const clientClients = [];
    for (let i = 0; i < clientsCount; i++) {
      const type = Math.random() > 0.7 ? 'company' : 'person';
      const parishId = randomElement(allParishes).id as string;

      if (type === 'person') {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        clientClients.push({
          parishId,
          code: `CLI-${String(i + 1).padStart(4, '0')}`,
          firstName,
          lastName,
          cnp: generateCNP(),
          birthDate: `${randomInt(1950, 2000)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          city: randomElement(cities),
          county: 'București',
          address: `${randomElement(streets)} ${randomInt(1, 200)}`,
          postalCode: `${randomInt(100000, 999999)}`,
          phone: generatePhone(),
          email: generateEmail(firstName, lastName),
          iban: Math.random() > 0.5 ? generateIBAN() : null,
          isActive: true,
          createdBy: userId,
        });
      } else {
        const companyName = randomElement(companyNames);
        clientClients.push({
          parishId,
          code: `CLI-${String(i + 1).padStart(4, '0')}`,
          companyName,
          cui: `${randomInt(10000000, 99999999)}`,
          regCom: `J${randomInt(10, 52)}/${randomInt(1000, 9999)}/${randomInt(2000, 2024)}`,
          city: randomElement(cities),
          county: 'București',
          address: `${randomElement(streets)} ${randomInt(1, 200)}`,
          postalCode: `${randomInt(100000, 999999)}`,
          phone: generatePhone(),
          email: generateEmail(undefined, undefined, companyName),
          bankName: Math.random() > 0.5 ? 'Banca Transilvania' : 'BCR',
          iban: generateIBAN(),
          isActive: true,
          createdBy: userId,
        });
      }
    }

    // Generate suppliers
    const supplierClients = [];
    for (let i = 0; i < suppliersCount; i++) {
      const type = Math.random() > 0.6 ? 'company' : 'person';
      const parishId = randomElement(allParishes).id as string;

      if (type === 'person') {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        supplierClients.push({
          parishId,
          code: `SUP-${String(i + 1).padStart(4, '0')}`,
          firstName,
          lastName,
          cnp: generateCNP(),
          birthDate: `${randomInt(1950, 2000)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          city: randomElement(cities),
          county: 'București',
          address: `${randomElement(streets)} ${randomInt(1, 200)}`,
          postalCode: `${randomInt(100000, 999999)}`,
          phone: generatePhone(),
          email: generateEmail(firstName, lastName),
          iban: Math.random() > 0.5 ? generateIBAN() : null,
          isActive: true,
          createdBy: userId,
        });
      } else {
        const companyName = randomElement(companyNames);
        supplierClients.push({
          parishId,
          code: `SUP-${String(i + 1).padStart(4, '0')}`,
          companyName,
          cui: `${randomInt(10000000, 99999999)}`,
          regCom: `J${randomInt(10, 52)}/${randomInt(1000, 9999)}/${randomInt(2000, 2024)}`,
          city: randomElement(cities),
          county: 'București',
          address: `${randomElement(streets)} ${randomInt(1, 200)}`,
          postalCode: `${randomInt(100000, 999999)}`,
          phone: generatePhone(),
          email: generateEmail(undefined, undefined, companyName),
          bankName: Math.random() > 0.5 ? 'Banca Transilvania' : 'BCR',
          iban: generateIBAN(),
          isActive: true,
          createdBy: userId,
        });
      }
    }

    // Insert clients in batches
    try {
      if (clientClients.length > 0) {
        await db.insert(clients).values(clientClients);
        results.clients = clientClients.length;
      }
    } catch (error: any) {
      results.errors.push(`Error creating clients: ${error.message}`);
      logError('Error creating fake clients', error);
    }

    // Insert suppliers in batches
    try {
      if (supplierClients.length > 0) {
        await db.insert(clients).values(supplierClients);
        results.suppliers = supplierClients.length;
      }
    } catch (error: any) {
      results.errors.push(`Error creating suppliers: ${error.message}`);
      logError('Error creating fake suppliers', error);
    }

    // Generate clients directly in clients table (system-wide, not parish-specific)
    if (directClientsCount > 0) {
      try {
        // Get existing client codes to avoid duplicates
        const existingClients = await db
          .select({
            code: clients.code,
          })
          .from(clients);

        // Find max code number
        let maxCodeNumber = 0;
        for (const client of existingClients) {
          const match = client.code.match(/^CLI-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxCodeNumber) {
              maxCodeNumber = num;
            }
          }
        }

        const clientsToCreate = [];
        for (let i = 0; i < directClientsCount; i++) {
          const type = Math.random() > 0.7 ? 'company' : 'person';
          
          // Generate unique code system-wide
          const nextCodeNumber = maxCodeNumber + i + 1;
          const code = `CLI-${String(nextCodeNumber).padStart(4, '0')}`;

          if (type === 'person') {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            clientsToCreate.push({
              code,
              firstName,
              lastName,
              cnp: generateCNP(),
              birthDate: `${randomInt(1950, 2000)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
              city: randomElement(cities),
              county: 'București',
              address: `${randomElement(streets)} ${randomInt(1, 200)}`,
              postalCode: `${randomInt(100000, 999999)}`,
              phone: generatePhone(),
              email: generateEmail(firstName, lastName),
              iban: Math.random() > 0.5 ? generateIBAN() : null,
              isActive: true,
              createdBy: userId,
            });
          } else {
            const companyName = randomElement(companyNames);
            clientsToCreate.push({
              code,
              companyName,
              cui: String(randomInt(1000000, 9999999)),
              regCom: `J40/${randomInt(1000, 9999)}/${randomInt(2000, 2024)}`,
              city: randomElement(cities),
              county: 'București',
              address: `${randomElement(streets)} ${randomInt(1, 200)}`,
              postalCode: `${randomInt(100000, 999999)}`,
              phone: generatePhone(),
              email: generateEmail(undefined, undefined, companyName),
              iban: Math.random() > 0.5 ? generateIBAN() : null,
              isActive: true,
              createdBy: userId,
            });
          }
        }

        // Insert clients in batches (max 50 at a time to avoid query size limits)
        if (clientsToCreate.length > 0) {
          const batchSize = 50;
          let insertedCount = 0;
          
          for (let i = 0; i < clientsToCreate.length; i += batchSize) {
            const batch = clientsToCreate.slice(i, i + batchSize);
            try {
              await db.insert(clients).values(batch);
              insertedCount += batch.length;
              console.log(`[generate-fake-data] Inserted batch of ${batch.length} clients (${insertedCount}/${clientsToCreate.length})`);
            } catch (batchError: any) {
              // If batch fails due to duplicates, try inserting one by one
              if (batchError.code === '23505') {
                console.log(`[generate-fake-data] Batch had duplicates, inserting individually...`);
                for (const client of batch) {
                  try {
                    await db.insert(clients).values(client);
                    insertedCount++;
                  } catch (individualError: any) {
                    if (individualError.code !== '23505') {
                      throw individualError;
                    }
                    // Skip duplicate
                    console.log(`[generate-fake-data] Skipping duplicate client: ${client.code}`);
                  }
                }
              } else {
                throw batchError;
              }
            }
          }
          
          results.directClients = insertedCount;
        }
      } catch (error: any) {
        results.errors.push(`Error creating clients: ${error.message}`);
        logError('Error creating fake clients', error);
      }
    }

    // Generate invoices
    if (invoicesCount > 0) {
      try {
        // Ensure clients exist before generating invoices
        const autoPartnersCount = await ensurePartnersExist(allParishes, userId, Math.max(5, Math.ceil(invoicesCount / 2)));
        if (autoPartnersCount > 0) {
          results.clients += Math.ceil(autoPartnersCount * 0.7);
          results.suppliers += Math.ceil(autoPartnersCount * 0.3);
        }

        // Get all active clients
        const allClients = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.isActive, true));

        if (allClients.length === 0) {
          results.errors.push('Nu s-au putut crea parteneri necesari pentru facturi.');
        } else {
          const invoiceList = [];
          for (let i = 0; i < invoicesCount; i++) {
            const parishId = randomElement(allParishes).id as string;
            const clientId = randomElement(allClients).id as string;
            const invoiceType = Math.random() > 0.5 ? 'issued' : 'received';
            const invoiceDate = generateDate(randomInt(0, 90));
            const dueDate = generateDateInFuture(randomInt(7, 30));
            const amount = randomInt(100, 10000);
            const vatAmount = Math.round(amount * 0.19 * 100) / 100;
            const total = amount + vatAmount;

            // Generate series and number from invoice number
            const invoiceNumber = `INV-${String(i + 1).padStart(6, '0')}`;
            const seriesMatch = invoiceNumber.match(/^([A-Z]+)-/);
            const series = seriesMatch ? seriesMatch[1] : 'INV';
            const numberMatch = invoiceNumber.match(/-(\d+)$/);
            const number = numberMatch ? parseInt(numberMatch[1]) : i + 1;

            const invoiceData: any = {
              parishId,
              invoiceNumber,
              type: invoiceType,
              date: invoiceDate,
              dueDate: dueDate,
              clientId,
              amount: amount.toString(),
              vat: vatAmount.toString(),
              total: total.toString(),
              currency: 'RON',
              status: Math.random() > 0.7 ? 'paid' : Math.random() > 0.5 ? 'sent' : 'draft',
              paymentDate: Math.random() > 0.7 ? invoiceDate : null,
              description: `Factură ${invoiceType === 'issued' ? 'emisă' : 'primită'} pentru servicii`,
              items: [{
                description: 'Servicii',
                quantity: 1,
                unitPrice: amount,
                vat: vatAmount,
                total: total
              }] as any,
              createdBy: userId,
              // Old schema columns for backward compatibility
              series: series,
              number: number,
              issueDate: invoiceDate,
              subtotal: amount.toString(),
              vatAmount: vatAmount.toString(),
            };

            invoiceList.push(invoiceData);
          }

          if (invoiceList.length > 0) {
            // Insert invoices one by one using raw SQL
            for (const invoice of invoiceList) {
              try {
                // Use raw SQL to include all columns (old and new schema)
                await db.execute(sql`
                  INSERT INTO invoices (
                    parish_id, invoice_number, type, 
                    series, number, issue_date, date,
                    due_date, client_id, 
                    amount, subtotal, vat, vat_amount, total, 
                    currency, status, payment_date, 
                    description, items, created_by
                  ) VALUES (
                    ${invoice.parishId}::uuid,
                    ${invoice.invoiceNumber},
                    ${invoice.type}::invoice_type,
                    ${invoice.series},
                    ${invoice.number},
                    ${invoice.issueDate}::date,
                    ${invoice.date}::date,
                    ${invoice.dueDate}::date,
                    ${invoice.clientId}::uuid,
                    ${invoice.amount}::numeric,
                    ${invoice.subtotal}::numeric,
                    ${invoice.vat}::numeric,
                    ${invoice.vatAmount}::numeric,
                    ${invoice.total}::numeric,
                    ${invoice.currency},
                    ${invoice.status}::invoice_status,
                    ${invoice.paymentDate ? sql`${invoice.paymentDate}::date` : sql`NULL`},
                    ${invoice.description},
                    ${JSON.stringify(invoice.items)}::jsonb,
                    ${invoice.createdBy}::uuid
                  )
                `);
                results.invoices++;
              } catch (singleError: any) {
                results.errors.push(`Error creating invoice ${invoice.invoiceNumber}: ${singleError.message}`);
                logError('Error creating fake invoice', singleError);
              }
            }
          }
        }
      } catch (error: any) {
        results.errors.push(`Error creating invoices: ${error.message}`);
        logError('Error creating fake invoices', error);
      }
    }

    // Generate payments
    if (paymentsCount > 0) {
      try {
        // Ensure clients exist before generating payments (optional, but better to have some)
        const autoPartnersCount = await ensurePartnersExist(allParishes, userId, Math.max(3, Math.ceil(paymentsCount / 3)));
        if (autoPartnersCount > 0) {
          results.clients += Math.ceil(autoPartnersCount * 0.7);
          results.suppliers += Math.ceil(autoPartnersCount * 0.3);
        }

        // Get all active clients
        const allClients = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.isActive, true));

        const paymentList = [];
        for (let i = 0; i < paymentsCount; i++) {
          const parishId = randomElement(allParishes).id as string;
          const clientId = allClients.length > 0 && Math.random() > 0.3 
            ? randomElement(allClients).id as string 
            : null;
          const paymentType = Math.random() > 0.5 ? 'income' : 'expense';
          const paymentDate = generateDate(randomInt(0, 90));
          const amount = randomInt(50, 5000);
          const paymentMethods = ['cash', 'bank_transfer', 'card', 'check'];
          const paymentMethod = randomElement(paymentMethods);

          paymentList.push({
            parishId,
            paymentNumber: `PAY-${String(i + 1).padStart(6, '0')}`,
            date: paymentDate,
            type: paymentType,
            category: paymentType === 'income' ? 'Donație' : 'Cheltuială',
            clientId,
            amount: amount.toString(),
            currency: 'RON',
            description: `Plată ${paymentType === 'income' ? 'venit' : 'cheltuială'}`,
            paymentMethod: paymentMethod,
            referenceNumber: Math.random() > 0.5 ? `REF-${randomInt(100000, 999999)}` : null,
            status: Math.random() > 0.2 ? 'completed' : 'pending',
            createdBy: userId,
          });
        }

        if (paymentList.length > 0) {
          await db.insert(payments).values(paymentList);
          results.payments = paymentList.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating payments: ${error.message}`);
        logError('Error creating fake payments', error);
      }
    }

    // Generate events
    if (eventsCount > 0) {
      try {
        const eventList = [];
        const eventTypes = ['wedding', 'baptism', 'funeral'];
        const priestNames = [
          'Părintele Ion Popescu',
          'Părintele Gheorghe Ionescu',
          'Părintele Vasile Radu',
          'Părintele Constantin Stan',
          'Părintele Mihai Dumitru'
        ];
        const locations = [
          'Biserica Sfântul Nicolae',
          'Biserica Adormirea Maicii Domnului',
          'Biserica Sfântul Gheorghe',
          'Biserica Sfânta Maria',
          'Biserica Sfântul Ioan'
        ];

        for (let i = 0; i < eventsCount; i++) {
          const parishId = randomElement(allParishes).id as string;
          const eventType = randomElement(eventTypes);
          const eventDate = generateDateInFuture(randomInt(0, 180));
          const statuses = ['pending', 'confirmed', 'completed'];
          const status = randomElement(statuses);

          eventList.push({
            parishId,
            type: eventType,
            status: status,
            eventDate: eventDate,
            location: randomElement(locations),
            priestName: randomElement(priestNames),
            notes: `Eveniment ${eventType === 'wedding' ? 'nuntă' : eventType === 'baptism' ? 'botez' : 'înmormântare'}`,
            createdBy: userId,
          });
        }

        if (eventList.length > 0) {
          await db.insert(churchEvents).values(eventList);
          results.events = eventList.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating events: ${error.message}`);
        logError('Error creating fake events', error);
      }
    }

    // Generate contracts
    if (contractsCount > 0) {
      try {
        // Ensure clients exist before generating contracts
        const autoPartnersCount = await ensurePartnersExist(allParishes, userId, Math.max(3, Math.ceil(contractsCount / 2)));
        if (autoPartnersCount > 0) {
          results.clients += Math.ceil(autoPartnersCount * 0.7);
          results.suppliers += Math.ceil(autoPartnersCount * 0.3);
        }

        // Get all active clients
        const allClients = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.isActive, true));

        if (allClients.length === 0) {
          results.errors.push('Nu s-au putut crea parteneri necesari pentru contracte.');
        } else {
          const contractList = [];
          const contractTypes = ['rental', 'concession', 'sale_purchase', 'loan', 'other'];
          const directions = ['incoming', 'outgoing'];
          const paymentFrequencies = ['monthly', 'quarterly', 'semiannual', 'annual', 'one_time'];
          const statuses = ['draft', 'active', 'expired', 'terminated'];

          for (let i = 0; i < contractsCount; i++) {
            const parishId = randomElement(allParishes).id as string;
            const clientId = randomElement(allClients).id as string;
            const contractType = randomElement(contractTypes);
            const direction = randomElement(directions);
            const paymentFrequency = randomElement(paymentFrequencies);
            const status = randomElement(statuses);
            const startDate = generateDate(randomInt(0, 365));
            const endDate = generateDateInFuture(randomInt(365, 1095)); // 1-3 years from start
            const signingDate = generateDate(randomInt(0, 30));
            const amount = randomInt(1000, 50000);

            contractList.push({
              parishId,
              contractNumber: `CTR-${String(i + 1).padStart(6, '0')}`,
              direction: direction as 'incoming' | 'outgoing',
              type: contractType as 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other',
              status: status as 'draft' | 'active' | 'expired' | 'terminated' | 'renewed',
              clientId,
              title: `Contract ${contractType} ${direction === 'incoming' ? 'primit' : 'oferit'}`,
              startDate: startDate,
              endDate: endDate,
              signingDate: signingDate,
              amount: amount.toString(),
              currency: 'RON',
              paymentFrequency: paymentFrequency as 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'one_time' | 'custom',
              description: `Contract ${contractType} pentru servicii`,
              autoRenewal: Math.random() > 0.7,
              createdBy: userId,
            });
          }

          if (contractList.length > 0) {
            await db.insert(contracts).values(contractList);
            results.contracts = contractList.length;
          }
        }
      } catch (error: any) {
        results.errors.push(`Error creating contracts: ${error.message}`);
        logError('Error creating fake contracts', error);
      }
    }

    // Generate products with stock
    if (productsCount > 0) {
      try {
        // Ensure warehouses exist for all parishes (parallel execution)
        const warehousesByParish = await ensureWarehousesForAllParishes(allParishes, userId);

        if (warehousesByParish.size === 0) {
          results.errors.push('No warehouses available. Cannot generate products.');
        } else {
          const productsToCreate = [];
          let skippedProducts = 0;

          for (let i = 0; i < productsCount; i++) {
            const parishId = randomElement(allParishes).id as string;
            const warehouseId = warehousesByParish.get(parishId);
            
            if (!warehouseId) {
              skippedProducts++;
              results.errors.push(`No warehouse found for parish ${parishId}, skipping product ${i + 1}`);
              continue;
            }

            const productName = randomElement(PRODUCT_NAMES);
            const category = randomElement(PRODUCT_CATEGORIES);
            const unit = randomElement(PRODUCT_UNITS);
            const purchasePrice = randomInt(10, 500);
            const salePrice = Math.round(purchasePrice * (1 + randomInt(10, 50) / 100));
            const vatRate = randomElement(VAT_RATES);
            const minStock = randomInt(5, 50);

            productsToCreate.push({
              parishId,
              code: generateUniqueProductCode(i),
              name: `${productName} ${i + 1}`,
              description: `Produs ${category}`,
              category: category as ProductCategory,
              unit,
              purchasePrice: purchasePrice.toString(),
              salePrice: salePrice.toString(),
              vatRate: vatRate,
              trackStock: true,
              minStock: minStock.toString(),
              isActive: true,
              createdBy: userId,
            });
          }

          if (productsToCreate.length > 0) {
            const insertedProducts = await db
              .insert(products)
              .values(productsToCreate)
              .returning({ id: products.id, parishId: products.parishId });
            
            results.products = insertedProducts.length;

            // Generate stock movements for a percentage of products
            const productsWithStock = Math.floor(insertedProducts.length * STOCK_MOVEMENT_PERCENTAGE);
            const movementsToCreate = [];

            for (const product of insertedProducts.slice(0, productsWithStock)) {
              const parishId = product.parishId as string;
              const warehouseId = warehousesByParish.get(parishId);
              
              if (!warehouseId) continue;

              const quantity = randomInt(10, 100);
              const unitCost = randomInt(5, 200);
              const totalValue = quantity * unitCost;
              const movementDate = generateDate(randomInt(0, 90));

              movementsToCreate.push({
                warehouseId,
                productId: product.id as string,
                parishId,
                type: 'in',
                movementDate,
                quantity: quantity.toString(),
                unitCost: unitCost.toString(),
                totalValue: totalValue.toString(),
                documentType: 'Intrare',
                documentNumber: `IN-${randomInt(1000, 9999)}`,
                documentDate: movementDate,
                createdBy: userId,
              });
            }

            if (movementsToCreate.length > 0) {
              await db.insert(stockMovements).values(movementsToCreate);
            }

            if (skippedProducts > 0) {
              results.errors.push(`${skippedProducts} products were skipped due to missing warehouses`);
            }
          } else if (skippedProducts === productsCount) {
            results.errors.push('All products were skipped due to missing warehouses');
          }
        }
      } catch (error: any) {
        results.errors.push(`Error creating products: ${error.message}`);
        logError('Error creating fake products', error);
      }
    }

    // Generate pangar products (products with category 'pangar')
    if (pangarProductsCount > 0) {
      try {
        // Ensure warehouses exist for all parishes (parallel execution)
        const warehousesByParish = await ensureWarehousesForAllParishes(allParishes, userId);

        if (warehousesByParish.size === 0) {
          results.errors.push('No warehouses available. Cannot generate pangar products.');
        } else {
          const pangarProductsToCreate = [];
          let skippedProducts = 0;

          // Pangar-specific product names
          const pangarProductNames = [
            'Lumânări', 'Vin liturgic', 'Pâine pentru euharistie', 'Tămâie', 'Ulei sfânt',
            'Cărți religioase', 'Icoane', 'Cruce', 'Cădelniță', 'Potir',
            'Patenă', 'Cingătoare', 'Vestmânt liturgic', 'Covor bisericesc', 'Candelabru'
          ];

          for (let i = 0; i < pangarProductsCount; i++) {
            const parishId = randomElement(allParishes).id as string;
            const warehouseId = warehousesByParish.get(parishId);
            
            if (!warehouseId) {
              skippedProducts++;
              results.errors.push(`No warehouse found for parish ${parishId}, skipping pangar product ${i + 1}`);
              continue;
            }

            const productName = randomElement(pangarProductNames);
            const unit = randomElement(PRODUCT_UNITS);
            const purchasePrice = randomInt(10, 500);
            const salePrice = Math.round(purchasePrice * (1 + randomInt(10, 50) / 100));
            const vatRate = randomElement(VAT_RATES);
            const minStock = randomInt(5, 50);

            pangarProductsToCreate.push({
              parishId,
              code: generateUniqueProductCode(i + 100000), // Use offset to avoid conflicts
              name: `${productName} ${i + 1}`,
              description: `Produs pangar`,
              category: 'pangar' as ProductCategory,
              unit,
              purchasePrice: purchasePrice.toString(),
              salePrice: salePrice.toString(),
              vatRate: vatRate,
              trackStock: true,
              minStock: minStock.toString(),
              isActive: true,
              createdBy: userId,
            });
          }

          if (pangarProductsToCreate.length > 0) {
            const insertedProducts = await db
              .insert(products)
              .values(pangarProductsToCreate)
              .returning({ id: products.id, parishId: products.parishId });
            
            results.pangarProducts = insertedProducts.length;

            // Generate stock movements for a percentage of pangar products
            const productsWithStock = Math.floor(insertedProducts.length * STOCK_MOVEMENT_PERCENTAGE);
            const movementsToCreate = [];

            for (const product of insertedProducts.slice(0, productsWithStock)) {
              const parishId = product.parishId as string;
              const warehouseId = warehousesByParish.get(parishId);
              
              if (!warehouseId) continue;

              const quantity = randomInt(10, 100);
              const unitCost = randomInt(5, 200);
              const totalValue = quantity * unitCost;
              const movementDate = generateDate(randomInt(0, 90));

              movementsToCreate.push({
                warehouseId,
                productId: product.id as string,
                parishId,
                type: 'in',
                movementDate,
                quantity: quantity.toString(),
                unitCost: unitCost.toString(),
                totalValue: totalValue.toString(),
                documentType: 'Intrare',
                documentNumber: `IN-PANGAR-${randomInt(1000, 9999)}`,
                documentDate: movementDate,
                createdBy: userId,
              });
            }

            if (movementsToCreate.length > 0) {
              await db.insert(stockMovements).values(movementsToCreate);
            }

            if (skippedProducts > 0) {
              results.errors.push(`${skippedProducts} pangar products were skipped due to missing warehouses`);
            }
          } else if (skippedProducts === pangarProductsCount) {
            results.errors.push('All pangar products were skipped due to missing warehouses');
          }
        }
      } catch (error: any) {
        results.errors.push(`Error creating pangar products: ${error.message}`);
        logError('Error creating fake pangar products', error);
      }
    }

    // Generate fixed assets
    if (fixedAssetsCount > 0) {
      try {
        const assetsToCreate = [];
        
        for (let i = 0; i < fixedAssetsCount; i++) {
          const parishId = randomElement(allParishes).id as string;
          const assetName = randomElement(FIXED_ASSET_NAMES);
          const category = randomElement(FIXED_ASSET_CATEGORIES);
          const location = randomElement(FIXED_ASSET_LOCATIONS);
          const acquisitionDate = generateDate(randomInt(30, 3650)); // Last 10 years
          const acquisitionValue = randomInt(500, 50000);
          const currentValue = Math.round(acquisitionValue * (randomInt(50, 100) / 100));
          const status = randomElement(FIXED_ASSET_STATUSES);

          assetsToCreate.push({
            parishId,
            inventoryNumber: generateUniqueInventoryNumber(i),
            name: `${assetName} ${i + 1}`,
            description: `Mijloc fix ${category.toLowerCase()}`,
            category,
            type: category,
            location,
            acquisitionDate,
            acquisitionValue: acquisitionValue.toString(),
            currentValue: currentValue.toString(),
            depreciationMethod: 'linear',
            usefulLifeYears: randomInt(5, 20),
            status: status as FixedAssetStatus,
          });
        }

        if (assetsToCreate.length > 0) {
          await db.insert(fixedAssets).values(assetsToCreate);
          results.fixedAssets = assetsToCreate.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating fixed assets: ${error.message}`);
        logError('Error creating fake fixed assets', error);
      }
    }

    // Generate inventory sessions
    if (inventoryCount > 0) {
      try {
        // Get existing products and fixed assets (with reasonable limit)
        const [existingProducts, existingFixedAssets] = await Promise.all([
          db
            .select({ id: products.id, parishId: products.parishId })
            .from(products)
            .where(eq(products.isActive, true))
            .limit(INVENTARY_ITEM_LIMIT),
          db
            .select({ id: fixedAssets.id, parishId: fixedAssets.parishId })
            .from(fixedAssets)
            .limit(INVENTARY_ITEM_LIMIT),
        ]);

        const sessionsToCreate = [];
        const inventoryStatuses = ['draft', 'in_progress', 'completed'] as const;
        
        for (let i = 0; i < inventoryCount; i++) {
          const parishId = randomElement(allParishes).id as string;
          const sessionDate = generateDate(randomInt(0, 180));
          const status = randomElement(inventoryStatuses);

          sessionsToCreate.push({
            parishId,
            date: sessionDate,
            status,
            notes: `Sesiune inventar ${i + 1}`,
            createdBy: userId,
          });
        }

        if (sessionsToCreate.length > 0) {
          const insertedSessions = await db
            .insert(inventorySessions)
            .values(sessionsToCreate)
            .returning({ 
              id: inventorySessions.id,
              parishId: inventorySessions.parishId 
            });

          // Generate inventory items for each session
          const itemsToCreate = [];
          
          for (const session of insertedSessions) {
            const parishId = session.parishId as string;
            
            // Add products for this parish
            const sessionProducts = existingProducts
              .filter(p => p.parishId === parishId)
              .slice(0, randomInt(3, 10));
            
            for (const product of sessionProducts) {
              const bookQuantity = randomInt(10, 100);
              const physicalQuantity = bookQuantity + randomInt(-5, 5); // Small difference
              const difference = physicalQuantity - bookQuantity;

              itemsToCreate.push({
                sessionId: session.id as string,
                itemType: 'product',
                itemId: product.id as string,
                bookQuantity: bookQuantity.toString(),
                physicalQuantity: physicalQuantity.toString(),
                difference: difference.toString(),
                notes: 'Inventar produs',
              });
            }

            // Add fixed assets for this parish
            const sessionAssets = existingFixedAssets
              .filter(a => a.parishId === parishId)
              .slice(0, randomInt(2, 8));
            
            for (const asset of sessionAssets) {
              const bookQuantity = 1;
              // Reduced probability of missing assets (2% instead of 10%)
              const physicalQuantity = Math.random() < MISSING_ASSET_PROBABILITY ? 0 : 1;
              const difference = physicalQuantity - bookQuantity;

              itemsToCreate.push({
                sessionId: session.id as string,
                itemType: 'fixed_asset',
                itemId: asset.id as string,
                bookQuantity: bookQuantity.toString(),
                physicalQuantity: physicalQuantity.toString(),
                difference: difference.toString(),
                notes: 'Inventar mijloc fix',
              });
            }
          }

          if (itemsToCreate.length > 0) {
            await db.insert(inventoryItems).values(itemsToCreate);
          }

          results.inventory = insertedSessions.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating inventory: ${error.message}`);
        logError('Error creating fake inventory', error);
      }
    }

    // Generate documents registry
    if (documentsCount > 0) {
      try {
        // Get existing clients for sender/recipient
        const existingClients = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.isActive, true))
          .limit(100);

        const currentYear = new Date().getFullYear();
        const documentsToCreate = [];

        for (let i = 0; i < documentsCount; i++) {
          const parishId = randomElement(allParishes).id as string;
          const documentType = randomElement(DOCUMENT_TYPES);
          const priority = randomElement(DOCUMENT_PRIORITIES);
          const status = randomElement(DOCUMENT_STATUSES);
          const registrationDate = generateDate(randomInt(0, 365));
          const registrationYear = new Date(registrationDate).getFullYear();
          const registrationNumber = randomInt(1, 9999);
          const formattedNumber = `${registrationNumber}/${registrationYear}`;
          
          // For incoming documents, set sender; for outgoing, set recipient
          const senderClientId = (documentType === 'incoming' && existingClients.length > 0 && Math.random() > 0.3)
            ? randomElement(existingClients).id as string
            : null;
          
          const recipientClientId = (documentType === 'outgoing' && existingClients.length > 0 && Math.random() > 0.3)
            ? randomElement(existingClients).id as string
            : null;

          const senderName = senderClientId 
            ? null 
            : (Math.random() > 0.5 ? `${randomElement(firstNames)} ${randomElement(lastNames)}` : randomElement(companyNames));
          
          const recipientName = recipientClientId
            ? null
            : (documentType === 'outgoing' && Math.random() > 0.5 
              ? `${randomElement(firstNames)} ${randomElement(lastNames)}` 
              : null);

          const subject = randomElement(DOCUMENT_SUBJECTS);
          const dueDate = status !== 'resolved' && status !== 'archived' && Math.random() > 0.5
            ? generateDateInFuture(randomInt(7, 90))
            : null;
          
          const resolvedDate = (status === 'resolved' || status === 'archived')
            ? generateDate(randomInt(0, 30))
            : null;

          documentsToCreate.push({
            parishId,
            registrationNumber,
            registrationYear,
            formattedNumber,
            documentType: documentType as DocumentType,
            registrationDate,
            externalNumber: Math.random() > 0.5 ? `EXT-${randomInt(1000, 9999)}` : null,
            externalDate: Math.random() > 0.5 ? generateDate(randomInt(0, 180)) : null,
            senderClientId,
            senderName,
            senderDocNumber: Math.random() > 0.6 ? `DOC-${randomInt(100, 999)}` : null,
            senderDocDate: Math.random() > 0.6 ? generateDate(randomInt(0, 90)) : null,
            recipientClientId,
            recipientName,
            subject: `${subject} ${i + 1}`,
            content: `Conținut document ${documentType === 'incoming' ? 'primit' : documentType === 'outgoing' ? 'trimis' : 'intern'} pentru ${subject.toLowerCase()}.`,
            priority: priority as DocumentPriority,
            status: status as DocumentStatus,
            dueDate,
            resolvedDate,
            isSecret: Math.random() > 0.95, // 5% chance of secret documents
            createdBy: userId,
          });
        }

        if (documentsToCreate.length > 0) {
          await db.insert(documentRegistry).values(documentsToCreate);
          results.documents = documentsToCreate.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating documents: ${error.message}`);
        logError('Error creating fake documents', error);
      }
    }

    // Generate users
    if (usersCount > 0) {
      try {
        const userRoles = ['episcop', 'vicar', 'paroh', 'secretar', 'contabil'] as const;
        const approvalStatuses = ['pending', 'approved', 'rejected'] as const;
        
        const usersToCreate = [];
        const existingEmails = new Set<string>();

        // Get existing emails to avoid duplicates
        const existingUsers = await db
          .select({ email: users.email })
          .from(users)
          .limit(1000);
        existingUsers.forEach(u => existingEmails.add(u.email));

        for (let i = 0; i < usersCount; i++) {
          const firstName = randomElement(firstNames);
          const lastName = randomElement(lastNames);
          const name = `${firstName} ${lastName}`;
          
          // Generate unique email
          let email = generateEmail(firstName, lastName);
          let emailIndex = 1;
          while (existingEmails.has(email)) {
            email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${emailIndex}@example.com`;
            emailIndex++;
          }
          existingEmails.add(email);

          const role = randomElement(userRoles);
          const approvalStatus = randomElement(approvalStatuses);
          const isActive = Math.random() > 0.1; // 90% active
          const address = Math.random() > 0.4 ? `${randomElement(streets)} ${randomInt(1, 200)}` : null;
          const city = Math.random() > 0.4 ? randomElement(cities) : null;
          const phone = Math.random() > 0.4 ? generatePhone() : null;

          // Generate verification token
          const verificationToken = generateVerificationToken();
          const verificationExpiry = new Date();
          verificationExpiry.setDate(verificationExpiry.getDate() + 7); // 7 days

          // Create temporary password hash
          const tempPassword = randomBytes(16).toString('hex');
          const tempPasswordHash = await hashPassword(tempPassword);

          usersToCreate.push({
            email,
            name,
            role,
            passwordHash: tempPasswordHash,
            address,
            city,
            phone,
            isActive,
            approvalStatus,
            verificationCode: verificationToken,
            verificationCodeExpiry: verificationExpiry,
          });
        }

        if (usersToCreate.length > 0) {
          await db.insert(users).values(usersToCreate);
          results.users = usersToCreate.length;
        }
      } catch (error: any) {
        results.errors.push(`Error creating users: ${error.message}`);
        logError('Error creating fake users', error);
      }
    }

    // Build success message
    const messages = [];
    if (results.clients > 0) messages.push(`${results.clients} clienți (parteneri)`);
    if (results.directClients > 0) messages.push(`${results.directClients} clienți`);
    if (results.suppliers > 0) messages.push(`${results.suppliers} furnizori`);
    if (results.invoices > 0) messages.push(`${results.invoices} facturi`);
    if (results.payments > 0) messages.push(`${results.payments} plăți`);
    if (results.events > 0) messages.push(`${results.events} evenimente`);
    if (results.contracts > 0) messages.push(`${results.contracts} contracte`);
    if (results.products > 0) messages.push(`${results.products} produse`);
    if (results.pangarProducts > 0) messages.push(`${results.pangarProducts} produse pangar`);
    if (results.fixedAssets > 0) messages.push(`${results.fixedAssets} mijloace fixe`);
    if (results.inventory > 0) messages.push(`${results.inventory} sesiuni inventar`);
    if (results.documents > 0) messages.push(`${results.documents} documente registratură`);
    if (results.users > 0) messages.push(`${results.users} utilizatori`);
    
    // Add note about auto-generated dependencies
    const autoGenerated = [];
    if (results.clients > 0 && results.clients < 10) autoGenerated.push('parteneri');
    if (autoGenerated.length > 0) {
      messages.push(`(s-au generat automat ${autoGenerated.join(', ')})`);
    }

    // Check if any data was generated
    const totalGenerated = results.clients + results.directClients + results.suppliers + results.invoices + results.payments + results.events + results.contracts + results.products + results.pangarProducts + results.fixedAssets + results.inventory + results.documents + results.users;

    if (totalGenerated === 0) {
      return NextResponse.json({
        success: false,
        error: results.errors.length > 0 
          ? results.errors.join('; ')
          : 'Nu s-au generat date. Verificați dacă există parohii active și parteneri (pentru facturi/plăți).',
        data: results,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Generat cu succes: ${messages.join(', ')}`,
    });
  } catch (error) {
    logError('Failed to generate fake data', error);
    return formatErrorResponse(error, 'Failed to generate fake data');
  }
}

