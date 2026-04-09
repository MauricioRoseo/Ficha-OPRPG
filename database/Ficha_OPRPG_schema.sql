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

    type VARCHAR(50),
    value INT DEFAULT 0,

    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Rituals
CREATE TABLE rituals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,

    name VARCHAR(100),
    circle INT,
    execution VARCHAR(50),
    range_type VARCHAR(50),
    target VARCHAR(100),
    duration VARCHAR(100),
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