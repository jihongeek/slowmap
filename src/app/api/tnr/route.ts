import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Define the database path
const dbPath = path.join(process.cwd(), 'tnr.db');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Filter parameters
    const sido = searchParams.get('sido');
    const sigungu = searchParams.get('sigungu');

    // Connect to SQLite
    const db = new Database(dbPath, { readonly: true });

    // Build query
    let query = 'SELECT * FROM tnr_data WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM tnr_data WHERE 1=1';
    const params: any[] = [];

    if (sido) {
      query += ' AND sido = ?';
      countQuery += ' AND sido = ?';
      params.push(sido);
    }

    if (sigungu) {
      query += ' AND sigungu = ?';
      countQuery += ' AND sigungu = ?';
      params.push(sigungu);
    }

    query += ' ORDER BY capture_date DESC LIMIT ? OFFSET ?';
    
    // Execute count query
    const totalResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalResult.total;

    // Execute data query
    const data = db.prepare(query).all(...params, limit, offset);

    // Close database connection
    db.close();

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch TNR data', details: error.message },
      { status: 500 }
    );
  }
}
