import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class LocalDatabase {
  static Database? _db;

  static Future<Database> get instance async {
    _db ??= await _open();
    return _db!;
  }

  static Future<Database> _open() async {
    final path = join(await getDatabasesPath(), 'finance_control.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE saldo_cache (
        conta_id    INTEGER PRIMARY KEY,
        saldo       REAL    NOT NULL,
        moeda       TEXT    NOT NULL DEFAULT 'BRL',
        atualizado  TEXT    NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE transacao_cache (
        id          TEXT PRIMARY KEY,
        conta_id    INTEGER NOT NULL,
        descricao   TEXT    NOT NULL,
        valor       REAL    NOT NULL,
        tipo        TEXT    NOT NULL,
        data        TEXT    NOT NULL,
        categoria   TEXT,
        atualizado  TEXT    NOT NULL
      )
    ''');

    await db.execute(
      'CREATE INDEX idx_transacao_conta ON transacao_cache (conta_id, data DESC)',
    );
  }

  /// Remove todo o cache local — chamado no logout e revogação de consentimento.
  static Future<void> limpar() async {
    final db = await instance;
    await db.delete('saldo_cache');
    await db.delete('transacao_cache');
    debugPrint('[LocalDatabase] Cache limpo');
  }
}
