#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_mkhf_user:tmwnYtCbOOAh2Ww7qiyA4mvVhD7LZvMu@dpg-d00k1j49c44c73fognv0-a.oregon-postgres.render.com/users_db_mkhf"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done