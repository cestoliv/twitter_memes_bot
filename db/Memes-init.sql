BEGIN TRANSACTION;
CREATE TABLE Memes(
    file_name varchar(1000), 
    keywords varchar(1000),
    CONSTRAINT PK_Memes PRIMARY KEY (file_name)
);
INSERT INTO "Memes" VALUES('trop_chaud_1.jpeg','trop chaud, trop, chaud');
INSERT INTO "Memes" VALUES('j_ai_venu_j_ai_vu_j_ai_pas_comprendu_1.jpeg','j''ai venu, j''ai vu, j''ai pas comprendu');
INSERT INTO "Memes" VALUES('perspicace_1.jpeg','perspicace');
INSERT INTO "Memes" VALUES('mec_arrete_t_es_dingo_ou_quoi.jpg','mec arrete, mec arrete t''es dingo ou quoi');
INSERT INTO "Memes" VALUES('putain_mec_tu_pars_en_live.jpg','putain mec tu pars en live');
COMMIT;