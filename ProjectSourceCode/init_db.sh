#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_7x3v_user:jxmVX1XnWFMTvL6ciZPnt2kZBJDDJ7zf@dpg-d057s7a4d50c73ahqurg-a.oregon-postgres.render.com/users_db_7x3v"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done