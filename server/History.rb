#coding: utf-8

require 'sqlite3'
require 'json'
require 'thread'
require_relative 'ClockWork'

class History
	def initialize(clock)
		@enable = $history
		@clock = clock
		@last_index = 0
		@history_queue = Queue.new

		# make db folder if it is not exist
		Dir.mkdir('db') unless FileTest.directory?('db')
		@db = SQLite3::Database.new('db/history.db')
		init_history_db
	end

	def init_history_db
		sql = "
			CREATE TABLE IF NOT EXISTS history (
				id,
				datetime,
				type,
				origin,
				who,
				target,
				contents
				)"
		@db.execute(sql)
		sql = "CREATE TABLE IF NOT EXISTS id (last)"
		@db.execute(sql)

		sql = "SELECT * from id"
		index = @db.execute(sql)
		if(index.size == 0)
			sql = "INSERT INTO id VALUES (0)"
			@db.execute(sql)
		else
			@last_index = index[0][0]
		end
		start_db
	end

	def start_db
		if(@enable == true)
			Thread.new do
				puts "waiting to start history updating"
				sleep 5
				while(element = @history_queue.pop)
					@db.transaction do
						begin
							loop {
								write(element[0],element[1],element[2],element[3],element[4])
								element = @history_queue.pop(true)
							}
						rescue
	#						puts "History Queue Empty"
						end
					end
				end
			end
		end
	end

	# contents is json format
	def add_history(type,contents,target,origin,who)
		return if(contents == nil || contents.length == 0 || contents[0].empty?)
		puts "Add History: #{type} #{contents} #{target} #{origin} #{who}"
		@history_queue.push([type,contents,target,origin,who]) if(@enable == true)
	end

	def operate(id,com,origin,who)
		return if($model.start_with?("SVM-S1"))
		return if(com['stat'] == 'foff')	# forced off for off delay
		contents = [com]
		add_history('operate',contents,id,origin,who)
	end

	def cos(id,cos)
		return if($model.start_with?("SVM-S1") == true)
		no_history = ['av','meter','power','th_stat','temp','notify','battery']
		rec = {}
		cos.each do |key,val|
#			next if(key == 'temp')
			rec[key] = val if(no_history.include?(key) == false) 	# don't add av and meter cos
		end
		return if(rec.length == 0)
		rec['av'] = cos['av'] if(cos['av'] != nil)
		type = 'cos'
		type = 'error' if(rec.keys.include?('error'))
		add_history(type,[rec],id,'','')
	end

	def write(type,contents,target,origin,who)
		time = @clock.get_time.to_i
		element = JSON.generate(contents)
		sql = "INSERT INTO history VALUES (#{@last_index},#{time},'#{type}','#{origin}','#{who}','#{target}','#{element}')"
		@db.execute(sql)
		@last_index += 1
		sql = "UPDATE id SET last = #{@last_index}"
		@db.execute(sql)
	end

	# get history selected by date, type and target
	# option is {from=>val,to=>val,type=>val,target=>val,cont=>val}
	# cont is used when continuous retrieving, cont is the newest id
	def get_history(num, option=nil)
		where = History.make_where(option)
		
		if(num == 0)
			sql = "SELECT * FROM history #{where} order by id desc"
		else
			sql = "SELECT * FROM history #{where} order by id desc limit #{num}"
		end
		
		data = @db.execute(sql)
		data.each do |element|
			element[1] = Time.at(element[1]).to_i
			element[6] = JSON.parse(element[6])
		end
		data
	end
	
	def get_first_id_number
		sql = "SELECT * FROM history limit 1"	#get first record ID number for HISTORY pageNav
		data = @db.execute(sql)
	end
	
	# get error history selected by date
	def get_error(option)
		where = History.make_where(option)
		sql = "SELECT datetime,target,contents FROM history #{where} AND contents like '%error__true%' ORDER BY target ASC"
		data = @db.execute(sql)
		data.each do |element|
			element[0] = Time.at(element[0]).to_i
			element[2] = JSON.parse(element[2])
		end
		data
	end

	def History.make_where(option)
		return "" if(option == nil)
		from = option['from']
		to = option['to']
		type = option['type']
		target = option['target']
		cont = option['cont']
		condition = []
		condition << "datetime >= #{from.to_i}" if(from != nil)
		condition << "datetime < #{to.to_i}" if(to != nil)
		condition << "type = '#{type}'" if(type != nil)
		condition << "target = '#{target}'" if(target != nil)
		condition << "id < #{cont}" if(cont != nil)
		return "" if(condition.length == 0)
		return "WHERE #{condition[0]}" if(condition.length == 1)
		ret = "WHERE #{condition[0]}"
		1.upto condition.length-1 do |i|
			ret += " AND #{condition[i]}"
		end
		ret
	end

	def limit_database
	 	date = Time.now.to_i - 380*24*60*60	# 1 year history
    sql = "DELETE FROM history WHERE datetime <= #{date}"
    @db.execute(sql)

#		rec = get_history(1)
#		rec_id = rec[0][0]-size
#		if(rec_id > 0)
#			sql = "DELETE FROM history WHERE id < #{rec_id}" 
#			@db.execute(sql)
#		end
	end
end

#db = History.new(ClockWork.new)
#1.upto 5 do |i|
#	db.add_history('info'+(i%5).to_s,['system','Start system',i],i%5,'test','operator')
#end
#sleep 10
#db.limit_database(320580)
#puts "latest 10"
#ret = db.get_history(10)
#ret.each do |i|
#	puts "#{i}"
#end
#puts "latest 10 info3"
#ret = db.get_history(10,{'type'=>'info3'})
#ret.each do |i|
#	puts "#{i}"
#end
#puts "latest 10 target 4"
#ret = db.get_history(10,{'target'=>4})
#ret.each do |i|
#	puts "#{i}"
#end
#puts "next 10 target 4"
#ret = db.get_history(10,{'target'=>4,'cont'=>ret[9][0]})
#ret.each do |i|
#	puts "#{i}"
#end
#puts "date specified"
#ret = db.get_history(10,{'from'=>Time.local(2015,1,12,21,53),'to'=>Time.local(2015,1,12,21,54)})
#ret.each do |i|
#	puts "#{i}"
#end
