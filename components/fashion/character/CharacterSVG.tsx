'use client';

import { useMemo, memo } from 'react';
import type { OutfitCategory } from '@/content/types';
import { getItemById } from '@/content/fashionItems';
import { OutfitLayer } from './OutfitLayer';

interface CharacterSVGProps {
  equippedItems: Partial<Record<OutfitCategory, string>>;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 150, md: 250, lg: 350 };

export const CharacterSVG = memo(function CharacterSVG({ equippedItems, size = 'md' }: CharacterSVGProps) {
  const px = sizes[size];
  const aspect = 200 / 450;

  // Resolve equipped items to their data
  const equipped = useMemo(
    () =>
      Object.entries(equippedItems)
        .filter(([, id]) => id)
        .map(([category, id]) => ({
          category: category as OutfitCategory,
          item: getItemById(id!),
        }))
        .filter((e) => e.item),
    [equippedItems]
  );

  return (
    <svg
      viewBox="0 0 200 450"
      width={px}
      height={px / aspect}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ===== DEFAULT HAIR (behind head, z=0) ===== */}
      {!equippedItems.hairstyle && (
        <g>
          {/* Hair back volume */}
          <ellipse cx="100" cy="72" rx="42" ry="48" fill="#8B4513" />
          {/* Hair drape left */}
          <path d="M60 72 Q55 130 65 160 Q70 150 72 130 Q68 100 62 72Z" fill="#7A3B10" />
          {/* Hair drape right */}
          <path d="M140 72 Q145 130 135 160 Q130 150 128 130 Q132 100 138 72Z" fill="#7A3B10" />
        </g>
      )}

      {/* Hair outfit layer (back) */}
      {equippedItems.hairstyle && (
        <OutfitLayer
          item={equipped.find((e) => e.category === 'hairstyle')?.item}
          layer="back"
        />
      )}

      {/* ===== HEAD ===== */}
      <g>
        {/* Neck */}
        <rect x="90" y="108" width="20" height="18" rx="4" fill="#FDBCB4" />

        {/* Head shape */}
        <ellipse cx="100" cy="75" rx="35" ry="40" fill="#FDBCB4" />

        {/* Ears */}
        <ellipse cx="65" cy="78" rx="6" ry="8" fill="#F5A898" />
        <ellipse cx="135" cy="78" rx="6" ry="8" fill="#F5A898" />

        {/* Eyes */}
        <g>
          {/* Left eye white */}
          <ellipse cx="85" cy="72" rx="10" ry="8" fill="white" />
          {/* Left iris */}
          <ellipse cx="86" cy="73" rx="6" ry="6" fill="#6B4226" />
          {/* Left pupil */}
          <circle cx="87" cy="72" r="3" fill="#2D1810" />
          {/* Left eye shine */}
          <circle cx="89" cy="70" r="1.5" fill="white" />
          {/* Left upper lash */}
          <path d="M75 66 Q80 63 85 64 Q90 63 95 66" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Left lower lash line */}
          <path d="M77 78 Q85 82 93 78" stroke="#8B6F5E" strokeWidth="0.5" fill="none" />

          {/* Right eye white */}
          <ellipse cx="115" cy="72" rx="10" ry="8" fill="white" />
          {/* Right iris */}
          <ellipse cx="114" cy="73" rx="6" ry="6" fill="#6B4226" />
          {/* Right pupil */}
          <circle cx="113" cy="72" r="3" fill="#2D1810" />
          {/* Right eye shine */}
          <circle cx="111" cy="70" r="1.5" fill="white" />
          {/* Right upper lash */}
          <path d="M105 66 Q110 63 115 64 Q120 63 125 66" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Right lower lash line */}
          <path d="M107 78 Q115 82 123 78" stroke="#8B6F5E" strokeWidth="0.5" fill="none" />
        </g>

        {/* Eyebrows */}
        <path d="M77 60 Q85 56 93 59" stroke="#5C3317" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M107 59 Q115 56 123 60" stroke="#5C3317" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M97 80 Q100 86 103 80" stroke="#E8A090" strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Smile */}
        <path d="M88 92 Q100 102 112 92" stroke="#CC6666" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Smile cheeks */}
        <circle cx="80" cy="88" r="5" fill="#FFB6C1" opacity="0.3" />
        <circle cx="120" cy="88" r="5" fill="#FFB6C1" opacity="0.3" />
      </g>

      {/* ===== DEFAULT HAIR TOP (over forehead) ===== */}
      {!equippedItems.hairstyle && (
        <g>
          {/* Hair top volume */}
          <path d="M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z" fill="#8B4513" />
          {/* Side fringe */}
          <path d="M65 68 Q68 55 80 50 Q72 58 68 68Z" fill="#7A3B10" />
        </g>
      )}

      {/* ===== BODY (torso + arms + legs base) ===== */}
      <g>
        {/* Torso */}
        <path d="M78 126 L72 220 L128 220 L122 126 Z" fill="#FDBCB4" />

        {/* Arms */}
        {/* Left arm */}
        <path d="M72 130 L52 200 L56 202 L78 140 Z" fill="#FDBCB4" />
        {/* Left hand */}
        <circle cx="53" cy="203" r="7" fill="#FDBCB4" />
        {/* Left fingers */}
        <path d="M48 198 L44 194" stroke="#FDBCB4" strokeWidth="3" strokeLinecap="round" />
        <path d="M46 201 L42 199" stroke="#FDBCB4" strokeWidth="3" strokeLinecap="round" />

        {/* Right arm */}
        <path d="M128 130 L148 200 L144 202 L122 140 Z" fill="#FDBCB4" />
        {/* Right hand */}
        <circle cx="147" cy="203" r="7" fill="#FDBCB4" />
        {/* Right fingers */}
        <path d="M152 198 L156 194" stroke="#FDBCB4" strokeWidth="3" strokeLinecap="round" />
        <path d="M154 201 L158 199" stroke="#FDBCB4" strokeWidth="3" strokeLinecap="round" />

        {/* Legs */}
        {/* Left leg */}
        <path d="M78 218 L76 370 L88 370 L92 218 Z" fill="#FDBCB4" />
        {/* Right leg */}
        <path d="M108 218 L112 370 L124 370 L122 218 Z" fill="#FDBCB4" />

        {/* Feet */}
        <ellipse cx="80" cy="374" rx="14" ry="6" fill="#FDBCB4" />
        <ellipse cx="120" cy="374" rx="14" ry="6" fill="#FDBCB4" />
      </g>

      {/* ===== OUTFIT LAYERS (in z-order) ===== */}
      {/* Shoes (z=10) */}
      <OutfitLayer item={equipped.find((e) => e.category === 'shoes')?.item} layer="front" />

      {/* Bottom (z=20) */}
      {!equippedItems.dress && (
        <OutfitLayer item={equipped.find((e) => e.category === 'bottom')?.item} layer="front" />
      )}

      {/* Dress (z=25, replaces top+bottom) */}
      <OutfitLayer item={equipped.find((e) => e.category === 'dress')?.item} layer="front" />

      {/* Top (z=30) */}
      {!equippedItems.dress && (
        <OutfitLayer item={equipped.find((e) => e.category === 'top')?.item} layer="front" />
      )}

      {/* Accessory (z=40) */}
      <OutfitLayer item={equipped.find((e) => e.category === 'accessory')?.item} layer="front" />

      {/* Hair front (z=50) */}
      {equippedItems.hairstyle && (
        <OutfitLayer
          item={equipped.find((e) => e.category === 'hairstyle')?.item}
          layer="front"
        />
      )}

      {/* ===== DEFAULT OUTFIT (if nothing equipped) ===== */}
      {!equippedItems.top && !equippedItems.dress && (
        <g>
          {/* Basic white tee */}
          <path d="M76 126 L70 190 L130 190 L124 126 Z" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="0.5" />
          {/* Neckline */}
          <path d="M88 126 Q100 134 112 126" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="0.5" />
          {/* Sleeve lines */}
          <line x1="76" y1="126" x2="66" y2="150" stroke="#E0E0E0" strokeWidth="0.5" />
          <line x1="124" y1="126" x2="134" y2="150" stroke="#E0E0E0" strokeWidth="0.5" />
        </g>
      )}
      {!equippedItems.bottom && !equippedItems.dress && (
        <g>
          {/* Basic jeans */}
          <path d="M72 188 L76 365 L92 365 L100 240 L108 365 L124 365 L128 188 Z" fill="#5B8FB9" stroke="#4A7CA5" strokeWidth="0.5" />
          {/* Center seam */}
          <line x1="100" y1="188" x2="100" y2="240" stroke="#4A7CA5" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );
});
