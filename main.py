import os, uvicorn, psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TodoCreate(BaseModel):
    title: str
    category_id: int
    user_id: int

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[int] = None
    done: Optional[bool] = None

PORT=8066

load_dotenv()
DB_URL =os.getenv("DB_URL")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db_connection():
    return psycopg.connect(DB_URL, row_factory=dict_row)

@app.get("/todos")
def todos(request: Request):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT todo_notes.id, title, done, category_name, created_at, updated_at
                FROM todo_notes
                JOIN todo_users ON todo_notes.user_id = todo_users.id
                JOIN todo_category ON todo_notes.category_id = todo_category.id
            """,)
            result = cur.fetchall()
            return result

@app.post("/todos")
def create_todo(todo: TodoCreate):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO todo_notes (user_id, category_id, title, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                todo.user_id,
                todo.category_id,
                todo.title,
                datetime.utcnow(),
                datetime.utcnow()
            ))
            conn.commit()
            return {"message": "Todo created"}


@app.put("/todos/{id}")
def update_todo(id: int, todo: TodoUpdate):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            updates = []
            values = []
            
            if todo.title is not None:
                updates.append("title = %s")
                values.append(todo.title)
            if todo.category_id is not None:
                updates.append("category_id = %s")
                values.append(todo.category_id)
            if todo.done is not None:
                updates.append("done = %s")
                values.append(todo.done)

            if not updates:
                return {"message": "Nothing to update"}

            values.append(id)

            cur.execute(f"""
                UPDATE todo_notes
                SET {", ".join(updates)}, updated_at = NOW()
                WHERE id = %s
            """, values)
            
            conn.commit()
            return {"message": f"Todo {id} updated"}

@app.delete("/todos/{id}")
def delete_todo(id: int):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM todo_notes WHERE id = %s", (id,))
            conn.commit()
            return {"message": f"Todo {id} deleted"}

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        ssl_keyfile="/etc/letsencrypt/privkey.pem",
        ssl_certfile="/etc/letsencrypt/fullchain.pem",
    )