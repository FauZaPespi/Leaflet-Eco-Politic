<?php
// Ce script php à été réalisé par chatgpt, ce script ma permit de debug des choses en lien avec la base de donnée

try {
    // Connect to the SQLite database
    $databasePath = __DIR__ . '/files/database/reports.db';
    $db = new PDO("sqlite:$databasePath");

    // Set error mode to exception
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // SQL to create the tables
    $sql = "
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        country TEXT NOT NULL,
        problem_type TEXT NOT NULL,
        old_name TEXT,
        new_name TEXT,
        report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS massReport (
        country TEXT PRIMARY KEY,
        report_count INTEGER NOT NULL DEFAULT 0,
        name_issue_count INTEGER DEFAULT 0,
        dataEP_issue_count INTEGER DEFAULT 0
    );

    UPDATE `reports` SET `ip` = '123321' WHERE `rowid` IS 1 AND `ip` IS '::1';
    ";

    // Execute the SQL commands
    $db->exec($sql);

    echo "Tables created or already exist.";
} catch (PDOException $e) {
    echo "An error occurred: " . $e->getMessage();
}
?>
