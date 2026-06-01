import sqlite3 as db


con = db.connect('users.db')


cursor = con.cursor()


def get_info(id):
    cursor.execute("SELECT name, password FROM users WHERE id=?", (id,))
    return cursor.fetchone()


def create_table():
    cursor.execute('''CREATE TABLE IF NOT EXISTS users
                    (id INTEGER, name TEXT, password TEXT)''')

    cursor.execute('''INSERT INTO users (id, name, password) VALUES (777, "admin", "ctf{f4ck1ng_1s_3asy}")''')

    con.commit()


if __name__ == "__main__":
    create_table()