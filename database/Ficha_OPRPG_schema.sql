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
    -- whether this feature (pericia) supports encumbrance penalty
    has_encumbrance_penalty TINYINT(1) DEFAULT 0,
    encumbrance_penalty INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character Features
CREATE TABLE character_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    feature_id INT NOT NULL,

    value INT DEFAULT 0,
    trained BOOLEAN DEFAULT FALSE,
    extra INT DEFAULT 0,
    notes TEXT,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
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

-- Attacks
CREATE TABLE attacks (
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

CREATE TABLE protections (
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

-- Per-character protections remain in `protections` table. Add a reference to the template (nullable)
ALTER TABLE `protections` ADD COLUMN `template_id` int DEFAULT NULL, ADD KEY `template_id` (`template_id`);
ALTER TABLE `protections` ADD CONSTRAINT `protections_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `protection_templates` (`id`) ON DELETE SET NULL;

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

ALTER TABLE character_features
DROP COLUMN trained;

ALTER TABLE character_features
ADD training_level ENUM('none', 'trained', 'veteran', 'expert') DEFAULT 'none';

-- Snapshot fields so a character can have an editable copy of a feature/template
ALTER TABLE character_features
ADD COLUMN template_id INT DEFAULT NULL,
ADD COLUMN template_name VARCHAR(150) DEFAULT NULL,
ADD COLUMN template_description TEXT DEFAULT NULL,
ADD COLUMN template_metadata JSON DEFAULT NULL,
ADD COLUMN encumbrance_penalty INT DEFAULT NULL,
ADD KEY `template_id` (`template_id`);
ALTER TABLE character_features
ADD CONSTRAINT `character_features_ibfk_template` FOREIGN KEY (`template_id`) REFERENCES features(`id`) ON DELETE SET NULL;

ALTER TABLE features
ADD COLUMN metadata JSON;

ALTER TABLE characters

-- VIDA
ADD vida_atual INT DEFAULT 0,
ADD vida_max INT DEFAULT 0,
ADD vida_temp INT DEFAULT 0,

-- SANIDADE
ADD sanidade_atual INT DEFAULT 0,
ADD sanidade_max INT DEFAULT 0,

-- ESFORÇO
ADD esforco_atual INT DEFAULT 0,
ADD esforco_max INT DEFAULT 0,
ADD esforco_temp INT DEFAULT 0,

-- PRESTÍGIO
ADD prestigio INT DEFAULT 0,

-- ESTADOS
ADD morrendo TINYINT DEFAULT 0,
ADD enlouquecendo TINYINT DEFAULT 0,

-- DESLOCAMENTO
ADD deslocamento_atual INT DEFAULT 0,
ADD deslocamento_max INT DEFAULT 0,

-- IMAGENS
ADD imagem_perfil TEXT,
ADD imagem_token TEXT;

-- Adiciona campos de defesa passiva, esquiva e bloqueio à tabela characters
ALTER TABLE characters
    ADD COLUMN defesa_passiva INT DEFAULT 0,
    ADD COLUMN esquiva INT DEFAULT 0,
    ADD COLUMN bloqueio INT DEFAULT 0;

-- Trigger: whenever a character is created, insert a default resistances row (all zeros)
DELIMITER //
CREATE TRIGGER trg_after_insert_character_resistances
AFTER INSERT ON characters
FOR EACH ROW
BEGIN
    INSERT INTO resistances (character_id) VALUES (NEW.id);
END;//
DELIMITER ;