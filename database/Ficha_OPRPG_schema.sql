-- Ordem Paranormal RPG - Database Schema
-- Generated for MySQL Workbench

CREATE DATABASE IF NOT EXISTS Ficha_OPRPG;
USE Ficha_OPRPG;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters: core table with extended snapshot/status fields
CREATE TABLE IF NOT EXISTS characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    idade INT DEFAULT NULL,

    classe VARCHAR(50) DEFAULT NULL,
    trilha VARCHAR(50) DEFAULT NULL,
    origem VARCHAR(50) DEFAULT NULL,

    nex INT DEFAULT 0,
    nivel INT DEFAULT NULL,
    level_mode ENUM('auto', 'manual') DEFAULT 'auto',

    -- vida/sanidade/esforco (snapshot and current)
    vida_atual INT DEFAULT 0,
    vida_max INT DEFAULT 0,
    vida_temp INT DEFAULT 0,

    sanidade_atual INT DEFAULT 0,
    sanidade_max INT DEFAULT 0,

    esforco_atual INT DEFAULT 0,
    esforco_max INT DEFAULT 0,
    esforco_temp INT DEFAULT 0,

    -- defenses / derived
    defesa_passiva INT DEFAULT 0,
    esquiva INT DEFAULT 0,
    bloqueio INT DEFAULT 0,

    -- misc
    prestigio INT DEFAULT 0,
    patente VARCHAR(150) DEFAULT NULL,
    afinidade ENUM('Sangue','Morte','Conhecimento','Energia') DEFAULT NULL,
    morrendo TINYINT DEFAULT 0,
    enlouquecendo TINYINT DEFAULT 0,

    deslocamento_atual INT DEFAULT 0,
    deslocamento_max INT DEFAULT 0,

    imagem_perfil TEXT DEFAULT NULL,
    imagem_token TEXT DEFAULT NULL,

    proficiencias TEXT DEFAULT NULL,
    patrimonio TEXT DEFAULT NULL,

    -- link to template tables (new): classe_id, trilha_id, origem_id
    classe_id INT DEFAULT NULL,
    trilha_id INT DEFAULT NULL,
    origem_id INT DEFAULT NULL,

    carga_atual INT DEFAULT 0,
    carga_maxima INT DEFAULT 0,

    status_formula JSON DEFAULT NULL,
    -- new: defense_formula allows configuring how passive/dodge/block are calculated
    defense_formula JSON DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attributes
CREATE TABLE IF NOT EXISTS attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    forca INT DEFAULT 1,
    agilidade INT DEFAULT 1,
    intelecto INT DEFAULT 1,
    vigor INT DEFAULT 1,
    presenca INT DEFAULT 1,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Features
CREATE TABLE IF NOT EXISTS features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('pericia','habilidade','poder','ritual','origem','trilha','regra_casa') NOT NULL,
    description TEXT,
    origin VARCHAR(150) DEFAULT NULL,
    has_encumbrance_penalty TINYINT(1) DEFAULT 0,
    encumbrance_penalty INT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character Features
CREATE TABLE IF NOT EXISTS character_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    feature_id INT NOT NULL,

    value INT DEFAULT 0,
    training_level ENUM('none','trained','veteran','expert') DEFAULT 'none',
    extra INT DEFAULT 0,
    notes TEXT,

    template_id INT DEFAULT NULL,
    template_name VARCHAR(150) DEFAULT NULL,
    template_description TEXT DEFAULT NULL,
    template_metadata JSON DEFAULT NULL,
    encumbrance_penalty INT DEFAULT NULL,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES features(id) ON DELETE SET NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    space INT DEFAULT 0,
    category VARCHAR(50),

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Attacks
CREATE TABLE IF NOT EXISTS attacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    attack_bonus VARCHAR(20),
    damage VARCHAR(50),
    crit VARCHAR(20),
    range_type VARCHAR(50),
    ammo VARCHAR(20),

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Resistances
CREATE TABLE IF NOT EXISTS resistances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    acid INT DEFAULT 0,
    balistico INT DEFAULT 0,
    corte INT DEFAULT 0,
    eletricidade INT DEFAULT 0,
    fogo INT DEFAULT 0,
    frio INT DEFAULT 0,
    impacto INT DEFAULT 0,
    mental INT DEFAULT 0,
    perfuracao INT DEFAULT 0,
    veneno INT DEFAULT 0,
    conhecimento INT DEFAULT 0,
    energia INT DEFAULT 0,
    sangue INT DEFAULT 0,
    morte INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Protections (per-character)
CREATE TABLE IF NOT EXISTS protections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    equipped TINYINT(1) DEFAULT 0,
    name VARCHAR(150) NOT NULL,
    passive_defense INT DEFAULT 0,
    damage_resistance INT DEFAULT 0,
    encumbrance_penalty INT DEFAULT 0,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Protection templates (catalog)
CREATE TABLE IF NOT EXISTS protection_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    passive_defense INT DEFAULT 0,
    damage_resistance INT DEFAULT 0,
    encumbrance_penalty INT DEFAULT 0,
    default_equipped TINYINT(1) DEFAULT 0,
    metadata JSON DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY (created_by),
    CONSTRAINT protection_templates_ibfk_1 FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure compatibility: for MySQL versions that don't support
-- `ADD COLUMN IF NOT EXISTS`, use INFORMATION_SCHEMA and prepared statements.
-- Run these statements while connected to the target database (USE Ficha_OPRPG;)

-- add status_formula if missing
SELECT COUNT(*) INTO @c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='characters' AND COLUMN_NAME='status_formula';
SET @sql = IF(@c=0, 'ALTER TABLE characters ADD COLUMN status_formula JSON DEFAULT NULL', 'SELECT "status_formula already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- add carga_atual if missing
SELECT COUNT(*) INTO @c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='characters' AND COLUMN_NAME='carga_atual';
SET @sql = IF(@c=0, 'ALTER TABLE characters ADD COLUMN carga_atual INT DEFAULT 0', 'SELECT "carga_atual already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- add carga_maxima if missing
SELECT COUNT(*) INTO @c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='characters' AND COLUMN_NAME='carga_maxima';
SET @sql = IF(@c=0, 'ALTER TABLE characters ADD COLUMN carga_maxima INT DEFAULT 0', 'SELECT "carga_maxima already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- add defense_formula if missing
SELECT COUNT(*) INTO @c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='characters' AND COLUMN_NAME='defense_formula';
SET @sql = IF(@c=0, 'ALTER TABLE characters ADD COLUMN defense_formula JSON DEFAULT NULL', 'SELECT "defense_formula already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- link protections to templates (nullable)
ALTER TABLE protections ADD COLUMN template_id INT DEFAULT NULL;
ALTER TABLE protections ADD KEY template_id_idx (template_id);
ALTER TABLE protections ADD CONSTRAINT protections_ibfk_2 FOREIGN KEY (template_id) REFERENCES protection_templates(id) ON DELETE SET NULL;

-- Rituals owned by a character
CREATE TABLE IF NOT EXISTS rituals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    name VARCHAR(150),
    circle TINYINT,
    effect TEXT,
    element VARCHAR(80),
    execution VARCHAR(150),
    symbol_image TEXT,
    range_type VARCHAR(80),
    alcance VARCHAR(150),
    duration VARCHAR(150),
    possivel_resistencia TINYINT DEFAULT 0,
    aprimoramento_discente TINYINT DEFAULT 0,
    custo_aprimoramento_discente INT DEFAULT NULL,
    aprimoramento_verdadeiro TINYINT DEFAULT 0,
    custo_aprimoramento_verdadeiro INT DEFAULT NULL,
    description TEXT,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Rituals catalog
CREATE TABLE IF NOT EXISTS rituals_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    circle TINYINT,
    element VARCHAR(80),
    description TEXT,
    effect TEXT,
    execution VARCHAR(150),
    alcance VARCHAR(150),
    duration VARCHAR(150),
    resistencia_pericia_id INT DEFAULT NULL,
    aprimoramento_discente TINYINT DEFAULT 0,
    custo_aprimoramento_discente INT DEFAULT NULL,
    descricao_aprimoramento_discente TEXT DEFAULT NULL,
    aprimoramento_verdadeiro TINYINT DEFAULT 0,
    custo_aprimoramento_verdadeiro INT DEFAULT NULL,
    descricao_aprimoramento_verdadeiro TEXT DEFAULT NULL,
    symbol_image TEXT,
    symbol_image_secondary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character rituals (links to catalog optionally) with snapshot fields
CREATE TABLE IF NOT EXISTS character_rituals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    ritual_catalog_id INT DEFAULT NULL,

    dt_resistencia INT DEFAULT NULL,
    circulo TINYINT DEFAULT NULL,
    limite_rituais INT DEFAULT NULL,

    snapshot_name VARCHAR(150) DEFAULT NULL,
    snapshot_element VARCHAR(80) DEFAULT NULL,
    snapshot_description TEXT,
    snapshot_execution VARCHAR(150) DEFAULT NULL,
    snapshot_alcance VARCHAR(150) DEFAULT NULL,
    snapshot_duration VARCHAR(150) DEFAULT NULL,
    snapshot_resistencia_pericia_id INT DEFAULT NULL,
    snapshot_resistencia_pericia_name VARCHAR(150) DEFAULT NULL,
    snapshot_aprimoramento_discente TINYINT DEFAULT 0,
    snapshot_custo_aprimoramento_discente INT DEFAULT NULL,
    snapshot_descricao_aprimoramento_discente TEXT DEFAULT NULL,
    snapshot_aprimoramento_verdadeiro TINYINT DEFAULT 0,
    snapshot_custo_aprimoramento_verdadeiro INT DEFAULT NULL,
    snapshot_descricao_aprimoramento_verdadeiro TEXT DEFAULT NULL,
    snapshot_symbol TEXT,
    snapshot_symbol_secondary TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (ritual_catalog_id) REFERENCES rituals_catalog(id) ON DELETE SET NULL
);

-- Systems
CREATE TABLE IF NOT EXISTS systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- System Features
CREATE TABLE IF NOT EXISTS system_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_id INT,
    feature_id INT,

    FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Trigger: when a character is created, insert default resistances row
-- ensure trigger (drop if exists then create)
DROP TRIGGER IF EXISTS trg_after_insert_character_resistances;
DELIMITER //
CREATE TRIGGER trg_after_insert_character_resistances
AFTER INSERT ON characters
FOR EACH ROW
BEGIN
    INSERT INTO resistances (character_id) VALUES (NEW.id);
END;//
DELIMITER ;

-- ------------------------------------------------------------------
-- Antecedentes (Background) - per character
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS character_backgrounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL UNIQUE,

    historico TEXT,
    aparencia TEXT,
    personalidade TEXT,
    prato_favorito TEXT,
    pessoas_importantes TEXT,
    pertences_queridos TEXT,
    contatos TEXT,
    traumas TEXT,
    doencas TEXT,
    manias TEXT,
    objetivo TEXT,

    metadata JSON DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- Class / Trilha / Origem templates
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    hp_initial INT DEFAULT 0,
    hp_per_level INT DEFAULT 0,
    effort_initial INT DEFAULT 0,
    effort_per_level INT DEFAULT 0,
    sanity_initial INT DEFAULT 0,
    sanity_per_level INT DEFAULT 0,
    choice_skills_count INT DEFAULT 0,
    proficiencies JSON DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Class trained skills (links classes to skill features)
CREATE TABLE IF NOT EXISTS class_trained_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    feature_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Class abilities: links a class to many ability features (optionally tied to a minimum level)
CREATE TABLE IF NOT EXISTS class_abilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    feature_id INT NOT NULL,
    min_level INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Class proficiencies (free-text or controlled names stored per class)
CREATE TABLE IF NOT EXISTS class_proficiencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trail abilities (link a trail to a feature at a specific milestone level)
CREATE TABLE IF NOT EXISTS trail_abilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trail_id INT NOT NULL,
    level INT NOT NULL,
    feature_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Origins: each origin links to two pericias (features.type='pericia') and one habilidade (features.type='habilidade')
CREATE TABLE IF NOT EXISTS origins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    pericia_1_id INT DEFAULT NULL,
    pericia_2_id INT DEFAULT NULL,
    habilidade_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pericia_1_id) REFERENCES features(id) ON DELETE SET NULL,
    FOREIGN KEY (pericia_2_id) REFERENCES features(id) ON DELETE SET NULL,
    FOREIGN KEY (habilidade_id) REFERENCES features(id) ON DELETE SET NULL
);

-- link character template ids to template tables
ALTER TABLE characters ADD CONSTRAINT fk_char_classe FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE characters ADD CONSTRAINT fk_char_trilha FOREIGN KEY (trilha_id) REFERENCES trails(id) ON DELETE SET NULL;
ALTER TABLE characters ADD CONSTRAINT fk_char_origem FOREIGN KEY (origem_id) REFERENCES origins(id) ON DELETE SET NULL;

-- Catalog of phobias that can be selected
CREATE TABLE IF NOT EXISTS phobias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    short_description VARCHAR(255) DEFAULT NULL,
    detailed_description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Association table: phobias linked to a character. Either phobia_id points to catalog
-- or custom_* fields store a user-created phobia.
CREATE TABLE IF NOT EXISTS character_phobias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    phobia_id INT DEFAULT NULL,
    custom_name VARCHAR(150) DEFAULT NULL,
    custom_short_description VARCHAR(255) DEFAULT NULL,
    custom_detailed_description TEXT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (phobia_id) REFERENCES phobias(id) ON DELETE SET NULL
);

-- Paranormal encounters cards per character
CREATE TABLE IF NOT EXISTS character_paranormal_encounters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    sanity_loss INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Character notes (notas) per character
CREATE TABLE IF NOT EXISTS character_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    content TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Character tabs (UI tabs per character)
CREATE TABLE IF NOT EXISTS character_tabs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    tab_key VARCHAR(100) NOT NULL,
    title VARCHAR(150) DEFAULT NULL,
    position INT DEFAULT 0,
    visible TINYINT(1) DEFAULT 1,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Items catalog (system-wide items available to seed into inventories)
CREATE TABLE IF NOT EXISTS items_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    space INT DEFAULT 0,
    category VARCHAR(50),
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

