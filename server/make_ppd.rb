require 'sqlite3'


ppd_db = SQLite3::Database.new('db/ppd.db')
sql = "
	CREATE TABLE IF NOT EXISTS ppd (
		id,
		datetime,
		power,
		stop
		)"
ppd_db.execute(sql)

from = Time.new(2018,2,1,0).to_i
to = Time.new(2018,4,1,0).to_i

from.step(to,3600) do |t|
	puts Time.at(t)
	val = rand(20)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00001',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(50)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00002',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(20)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00003',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(40)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00004',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(10)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00005',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(30)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00006',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(20)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00007',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(10)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00008',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(30)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00009',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(40)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00010',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(20)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00011',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(10)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00012',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(30)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00013',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(20)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00014',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(10)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00015',#{t},#{val},0)"
	ppd_db.execute(sql)
	val = rand(30)*1000
	sql = "INSERT INTO ppd VALUES ('hatcp001-00016',#{t},#{val},0)"
	ppd_db.execute(sql)
end
ppd_db.close