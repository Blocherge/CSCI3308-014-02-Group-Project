LOAD DATA LOCAL INFILE "/Users/xavierrudnick/Desktop/softDev/CSCI3308-014-02-Group-Project/ProjectSourceCode/Api_Implementation/eldora_weather_api.py"
INTO TABLE your_table_name
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
