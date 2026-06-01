from fastapi import FastAPI # type:ignore
from database import get_info

app = FastAPI() # port 3000


global last_id
last_id = 0
@app.get("/api/users/view")
async def root(id:str):
    items = {
        "id": id
    }
    
    if list(items.keys())[0] == "id":
        try:
            id = int(id)
        except ValueError:
            pass
        if isinstance(id, int):
            global last_id
            last_id = id
            data = get_info(id)
            if data is None:
                return {"message": f"[!] No user found with id {id}!"}
            else:
                return {"message": f"Hello, user id {id}!", "Your info": f"{data[0]}, {data[1]}"}
        elif isinstance(id, str):
            return {"message": f"[!] No user id has been provided! Last id is {last_id}."}
    else: 
        return {"message": "[!] Invalid query parameter!"}
    




