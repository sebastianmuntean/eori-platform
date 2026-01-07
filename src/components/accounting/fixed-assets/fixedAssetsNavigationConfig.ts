/**
 * Navigation configuration for Fixed Assets page
 * Centralized configuration for better maintainability
 */

import { ComponentType } from 'react';
import {
  FixedAssetsIconBox,
  FixedAssetsIconDocument,
  FixedAssetsIconExit,
  FixedAssetsIconHash,
  FixedAssetsIconList,
  FixedAssetsIconTable,
} from './FixedAssetsIcons';

interface NavigationItemConfig {
  translationKey: string;
  descriptionKey: string;
  titleFallback: string;
  descriptionFallback: string;
  route: string;
  icon: ComponentType;
  hasSubItems?: boolean;
}

/**
 * Register sub-item configuration
 * Maps translation keys to route slugs with fallback text
 */
export const REGISTER_SUB_ITEMS = [
  { translationKey: 'buildings', route: 'buildings', fallback: 'Cladiri' },
  { translationKey: 'land', route: 'land', fallback: 'Terenuri' },
  { translationKey: 'transport', route: 'transport', fallback: 'Mijloace de transport' },
  { translationKey: 'preciousObjects', route: 'precious-objects', fallback: 'Obiecte din materiale prețioase' },
  { translationKey: 'religiousObjects', route: 'religious-objects', fallback: 'Obiecte de cult' },
  { translationKey: 'furniture', route: 'furniture', fallback: 'Mobilier, aparatura, decorațiuni' },
  { translationKey: 'religiousBooks', route: 'religious-books', fallback: 'Cărți de cult' },
  { translationKey: 'libraryBooks', route: 'library-books', fallback: 'Cărți de bibliotecă' },
  { translationKey: 'culturalGoods', route: 'cultural-goods', fallback: 'Registrul pentru evidenta analitica a bunurilor culturale' },
  { translationKey: 'modernizations', route: 'modernizations', fallback: 'Modernizari' },
] as const;

/**
 * Main navigation items configuration
 */
export const NAVIGATION_ITEMS_CONFIG: readonly NavigationItemConfig[] = [
  {
    translationKey: 'fixedAssetsManagement',
    descriptionKey: 'fixedAssetsManagementDesc',
    titleFallback: 'Mijloace fixe si obiecte de inventar',
    descriptionFallback: 'Gestionare mijloace fixe si obiecte de inventar',
    route: 'manage',
    icon: FixedAssetsIconBox,
  },
  {
    translationKey: 'inventoryRegisters',
    descriptionKey: 'inventoryRegistersDesc',
    titleFallback: 'Registre de inventor',
    descriptionFallback: 'Acces la registrele de inventar pe categorii',
    route: 'registers',
    icon: FixedAssetsIconDocument,
    hasSubItems: true,
  },
  {
    translationKey: 'exitsFromManagement',
    descriptionKey: 'exitsFromManagementDesc',
    titleFallback: 'Ieșiri din gestiune',
    descriptionFallback: 'Vizualizare mijloace fixe scoase din gestiune',
    route: 'exits',
    icon: FixedAssetsIconExit,
  },
  {
    translationKey: 'inventoryNumbersRegister',
    descriptionKey: 'inventoryNumbersRegisterDesc',
    titleFallback: 'Registrul numerelor de inventar',
    descriptionFallback: 'Registru complet al numerelor de inventar',
    route: 'inventory-numbers',
    icon: FixedAssetsIconHash,
  },
  {
    translationKey: 'inventoryLists',
    descriptionKey: 'inventoryListsDesc',
    titleFallback: 'Liste de inventar',
    descriptionFallback: 'Liste și rapoarte de inventar',
    route: 'inventory-lists',
    icon: FixedAssetsIconList,
  },
  {
    translationKey: 'inventoryTables',
    descriptionKey: 'inventoryTablesDesc',
    titleFallback: 'Tabele de inventar',
    descriptionFallback: 'Tabele și statistici de inventar',
    route: 'inventory-tables',
    icon: FixedAssetsIconTable,
  },
] as const;

