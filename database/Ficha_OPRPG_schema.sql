-- Ordem Paranormal RPG - Database Schema
-- Generated for MySQL Workbench

CREATE DATABASE IF NOT EXISTS Ficha_OPRPG;
USE Ficha_OPRPG;

-- Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    idade INT,

    classe VARCHAR(50),
    trilha VARCHAR(50),
    origem VARCHAR(50),

    nex INT DEFAULT 0,
    nivel INT NULL,
    level_mode ENUM('auto', 'manual') DEFAULT 'auto',

    vida INT DEFAULT 0,
    sanidade INT DEFAULT 0,
    esforco INT DEFAULT 0,
    defesa INT DEFAULT 0,

    -- Snapshot and runtime status fields
    vida_atual INT DEFAULT 0,
    vida_max INT DEFAULT 0,
    vida_temp INT DEFAULT 0,

    sanidade_atual INT DEFAULT 0,
    sanidade_max INT DEFAULT 0,

    esforco_atual INT DEFAULT 0,
    esforco_max INT DEFAULT 0,
    esforco_temp INT DEFAULT 0,

    prestigio INT DEFAULT 0,

    patente VARCHAR(100) DEFAULT NULL,

    morrendo TINYINT DEFAULT 0,
    enlouquecendo TINYINT DEFAULT 0,

    deslocamento_atual INT DEFAULT 0,
    deslocamento_max INT DEFAULT 0,

    imagem_perfil TEXT,
    imagem_token TEXT,

    defesa_passiva INT DEFAULT 0,
    esquiva INT DEFAULT 0,
    bloqueio INT DEFAULT 0,
    proficiencias TEXT,
    -- carga atual e máxima e patrimônio (inventário)
    carga_atual INT DEFAULT 0,
    carga_maxima INT DEFAULT 0,
    patrimonio TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attributes
CREATE TABLE attributes (
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
CREATE TABLE features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM(
        'pericia',
        'habilidade',
        'poder',
        'ritual',
        'origem',
        'trilha',
        'regra_casa'
    ) NOT NULL,
    description TEXT,
    origin VARCHAR(150) DEFAULT NULL,
    -- whether this feature (pericia) supports encumbrance penalty
    has_encumbrance_penalty TINYINT(1) DEFAULT 0,
    encumbrance_penalty INT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character Features
CREATE TABLE character_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    feature_id INT NOT NULL,

    value INT DEFAULT 0,
    extra INT DEFAULT 0,
    notes TEXT,

    -- training level replaces the old boolean 'trained'
    training_level ENUM('none', 'trained', 'veteran', 'expert') DEFAULT 'none',

    -- snapshot of an optional template for this feature
    template_id INT DEFAULT NULL,
    template_name VARCHAR(150) DEFAULT NULL,
    template_description TEXT DEFAULT NULL,
    template_metadata JSON DEFAULT NULL,
    encumbrance_penalty INT DEFAULT NULL,

    KEY `template_id` (`template_id`),

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    CONSTRAINT `character_features_ibfk_template` FOREIGN KEY (`template_id`) REFERENCES features(`id`) ON DELETE SET NULL
);

-- Inventory
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    space INT DEFAULT 0,
    category VARCHAR(50),

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Catalog of system items for searching presets
CREATE TABLE items_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    space INT DEFAULT 0,
    category ENUM('0','I','II','III','IV') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attacks (weapons/attacks per character)
CREATE TABLE attacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    weapon VARCHAR(150) NOT NULL,
    damage_type VARCHAR(50) DEFAULT NULL,
    range_type ENUM('Adjacente','Curto','Médio','Longo','Extremo','Ilimitado') DEFAULT 'Adjacente',
    base_pericia VARCHAR(80) DEFAULT NULL, -- stored as 'xd20+y' string
    damage VARCHAR(80) DEFAULT NULL,
    crit_margin INT DEFAULT NULL,
    crit_multiplier INT DEFAULT NULL,
    ammo VARCHAR(80) DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Resistances
CREATE TABLE resistances (
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

-- New table for protection templates (catalog of protections available system-wide)
CREATE TABLE `protection_templates` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `description` text,
    `passive_defense` int DEFAULT 0,
    `damage_resistance` int DEFAULT 0,
    `encumbrance_penalty` int DEFAULT 0,
    `default_equipped` tinyint(1) DEFAULT 0,
    `metadata` json DEFAULT NULL,
    `created_by` int DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `protection_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE protections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    equipped TINYINT(1) DEFAULT 0,
    name VARCHAR(150) NOT NULL,
    passive_defense INT DEFAULT 0,
    damage_resistance INT DEFAULT 0,
    encumbrance_penalty INT DEFAULT 0,
    template_id INT DEFAULT NULL,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    KEY `template_id` (`template_id`),
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    CONSTRAINT `protections_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `protection_templates` (`id`) ON DELETE SET NULL
);

-- Per-character protections remain in `protections` table and already include `template_id` referencing templates

-- Convenience: copy of template into protections will duplicate relevant fields so users may edit without affecting the template.

-- Rituals
CREATE TABLE rituals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    name VARCHAR(150),
    circle TINYINT,
    effect TEXT,
    element VARCHAR(80),
    execution VARCHAR(100),
    symbol_image TEXT,
    range_type VARCHAR(80),
    alcance VARCHAR(100),
    duration VARCHAR(100),
    possivel_resistencia TINYINT DEFAULT 0,
    aprimoramento_discente TINYINT DEFAULT 0,
    custo_aprimoramento_discente INT DEFAULT NULL,
    aprimoramento_verdadeiro TINYINT DEFAULT 0,
    custo_aprimoramento_verdadeiro INT DEFAULT NULL,
    description TEXT,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Systems
CREATE TABLE systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- System Features
CREATE TABLE system_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    system_id INT,
    feature_id INT,

    FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Previously applied ALTER TABLE migrations have been integrated into the CREATE statements above.

-- Trigger: whenever a character is created, insert a default resistances row (all zeros)
DELIMITER //
CREATE TRIGGER trg_after_insert_character_resistances
AFTER INSERT ON characters
FOR EACH ROW
BEGIN
    INSERT INTO resistances (character_id) VALUES (NEW.id);
END;//
DELIMITER ;

-- Character tabs: per-character configuration of visible tabs in the character UI
CREATE TABLE character_tabs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    tab_key VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    position INT DEFAULT 0,
    visible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);