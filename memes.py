import sqlite3
import unidecode
import operator
from termcolor import colored
import sys
import shutil
import glob
import os
from datetime import datetime
import subprocess

db_file = "db/Memes.db"
sql_file = "db/Memes.sql"
sql_init_file = "db/Memes-init.sql"

def db_connect():
    need_dump = False
    if not os.path.exists(db_file):
        need_dump = True

    try:
        conn = sqlite3.connect(db_file)
		# Activate foreign keys
        conn.execute("PRAGMA foreign_keys = 1")
        
        if need_dump:
            sql_file_to_use = sql_init_file

            if os.path.exists(sql_file):
                sql_file_to_use = sql_file

            createFile = open(sql_file_to_use, 'r')
            createSql = createFile.read()
            createFile.close()
            sqlQueries = createSql.split(";")

            cursor = conn.cursor()
            for query in sqlQueries:
                cursor.execute(query)

            conn.commit()

        return conn
    except sqlite3.Error as e:
        print("db : " + str(e))

    return None

def db_dump(db_conn):
    #now = str(datetime.timestamp(datetime.now()))
    #shutil.copy(sql_file, sql_file + "." + now + ".sql")

    with open(sql_file, 'w') as f:
        for line in db_conn.iterdump():
            f.write('%s\n' % line)

def get_memes(db_conn, query:str = None):

    db_results = []

    if query == None:
        cur = db_conn.cursor()
        cur.execute("SELECT * FROM Memes")
        db_results = cur.fetchall()

        db_results_dict = []

        for meme in db_results:
            meme_file = meme[0]
            keywords = meme[1]

            db_results_dict.append({
                "file": meme_file,
                "keywords": keywords,
            })

        return db_results_dict
    else:
        query_split = query.split()

        cur = db_conn.cursor()
        for word in query_split:
            cur.execute("SELECT * FROM Memes WHERE keywords LIKE '%'||?||'%'", (word, ))
            db_results = [*db_results, *cur.fetchall()]

        # elimination of duplicates
        db_results_cleaned = []
        for d in db_results:
            if d not in db_results_cleaned:
                db_results_cleaned.append(d)

        # add score to each result
        db_results_noted = []
        for meme in db_results_cleaned:
            meme_file = meme[0]
            keywords = meme[1].split(",")

            """
                for each keyword which corresponds to that of the meme, 
                we add ont point to the meme
            """

            meme_score = 0

            for word in query_split:
                # normalize word
                word = unidecode.unidecode(word).lower()
                for keyword in keywords:
                    # normalize keyword
                    keyword = unidecode.unidecode(keyword).lower()

                    if word in keyword:
                        meme_score += 1

            db_results_noted.append({
                "file": meme_file,
                "keywords": ", ".join(keywords),
                "score": meme_score
            })

        # order by score
        db_results_noted.sort(key=operator.itemgetter('score'), reverse=True)
        return db_results_noted

def add_meme(db_conn, file_path: str, file_name: str, keywords: str):
    print(os.getcwd())
    # check if meme don't still exists in files
    new_file_path = "memes/" + file_name
    new_file_path_without_extension = os.path.splitext(new_file_path)[0]

    if glob.glob(new_file_path_without_extension + ".*"):
        return {"status": "error", "errno": 3}

    # copy image to meme folder
    try :
        shutil.copy(file_path, new_file_path)
    except OSError as err:
        print("add error : " + str(err.errno) + " : " + str(err))
        if err.errno == 2:
            return {"status": "error", "errno": 2}
        else:
            print("add error : " + err.errno + " : " + err)
            return {"status": "error", "errno": -1}

    # add meme to db
    keywords = unidecode.unidecode(keywords).lower()
    cur = db_conn.cursor()
    cur.execute("INSERT INTO Memes (file_name, keywords) VALUES (?, ?)", (file_name, keywords))
    db_conn.commit()

    db_dump(db_conn)
    return {"status": "sucess"}

def purge_memes(db_conn):
    db_memes = get_memes(db_conn)
    db_memes_files = []
    for meme in db_memes:
        db_memes_files.append(meme["file"])

    files_memes = os.listdir("memes")

    # if no file
    cur = db_conn.cursor()
    db_to_remove = []
    for meme in db_memes_files:
        if meme not in files_memes:
            db_to_remove.append(meme)
            cur.execute("DELETE FROM Memes WHERE file_name LIKE ?", (meme, ))
    db_conn.commit()

    # if no db entry
    files_to_remove = []
    for meme in files_memes:
        if meme not in db_memes_files:
            files_to_remove.append(meme)
            os.remove("memes/" + meme)

    db_dump(db_conn)
    
    return {"db": db_to_remove, "files": files_to_remove}


def console_main(db_conn):
    def get_action(db_conn):
        print("What do you want to do ?")
        print("- Action with memes:")
        print("  [List] [Search] [Add] [Edit] [Delete] [Purge]")
        print("- Actions with the script")
        print("  [Quit]")

        action = str(input("-> ")).lower()

        print()

        if action == "list":
            memes = get_memes(db_conn)
            for meme in memes:
                print("  - " + meme["file"] + " | " + meme["keywords"])

            print()
            if len(memes) > 1:
                print(colored(str(len(memes)) + " memes in the database", attrs=["bold"]))
            else:
                print(colored(str(len(memes)) + " meme in the database", attrs=["bold"]))
        elif action == "search":
            query = str(input("search : "))
            print()

            memes = get_memes(db_conn, query)
            if len(memes) > 1:
                print(colored('Results for "' + query + '"', attrs=["bold"]))
            else:
                print(colored('Result for "' + query + '"', attrs=["bold"]))

            print()
            for meme in memes:
                print("  - " + meme["file"] + " | " + meme["keywords"])

            print()
            if len(memes) > 1:
                print(colored(str(len(memes)) + " results in the database", attrs=["bold"]))
            else:
                print(colored(str(len(memes)) + " result in the database", attrs=["bold"]))
        elif action == "add":
            #file_path = str(input("image path : "))
            file_path = subprocess.check_output('read -e -p "image path : " var ; echo $var',shell=True).rstrip().decode('UTF-8')
            print(file_path)
            file_name = str(input("new image name : "))
            keywords = str(input("keywords (separated by commas) : "))
            print()

            add_result = add_meme(db_conn, file_path, file_name, keywords)

            if add_result["status"] == "sucess":
                print(colored("Meme successfully added!", attrs=["bold"]))
            else:
                if "errno" in add_result:
                    if add_result["errno"] == 2:
                        print(colored("Image source file (" + file_path + ") does not exist", "red"))
                    if add_result["errno"] == 3:
                        print(colored("A meme with this name already exists (" + file_name + ")", "red"))
        elif action == "purge":
            print("  This option will remove unnecessary SQL entries and unnecessary files, do you want to continue? " + colored("(y / n)", attrs=["bold"]))
            continue_input = str(input("  -> ")).lower()

            if continue_input == "y":
                print()
                purge_result = purge_memes(db_conn)

                if len(purge_result["db"]) > 1:
                    print(colored(str(len(purge_result["db"])) + " SQL entries without files were deleted", attrs=["bold"]))
                else:
                    print(colored(str(len(purge_result["db"])) + " SQL entry without files were deleted", attrs=["bold"]))

                if len(purge_result["files"]) > 1:
                    print(colored(str(len(purge_result["files"])) + " files without SQL entry have been deleted", attrs=["bold"]))
                else:
                    print(colored(str(len(purge_result["files"])) + " file without SQL entry have been deleted", attrs=["bold"]))

        elif action == "quit":
            sys.exit()
        else:
            print(colored("This action does not exist...", "red"))

        print()
        print()

        return get_action(db_conn)

    get_action(db_conn)

def main():
    db_conn = db_connect()

    console_main(db_conn)

    db_conn.commit()
    db_conn.close()

if __name__ == "__main__":
    main()