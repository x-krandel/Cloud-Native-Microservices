from database import get_info


if __name__ == "__main__":
    id = 777
    data = get_info(id)
    print(f"Hello, user id {id}!", f"Your info: {data[0]}, {data[1]}")