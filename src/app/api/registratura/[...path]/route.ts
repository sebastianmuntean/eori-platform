import { NextRequest, NextResponse } from 'next/server';

/**
 * Temporary compatibility redirect: /api/registratura/* → /api/registry/*
 * Keeps old clients working during the registry rename migration.
 */
function redirectToRegistry(request: NextRequest, path: string[]) {
  const suffix = path.filter(Boolean).join('/');
  const target = new URL(`/api/registry/${suffix}`, request.url);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 308);
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return redirectToRegistry(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return redirectToRegistry(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return redirectToRegistry(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return redirectToRegistry(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return redirectToRegistry(request, path);
}
