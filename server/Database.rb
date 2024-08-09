#coding: utf-8

require 'sqlite3'
require 'json'
require 'thread'
require 'fileutils'

class Database 
  def initialize
    @enable = $database
    # make db folder if it is not exist
    Dir.mkdir('db') unless FileTest.directory?('db')
    @pointdata_db = SQLite3::Database.new('db/pointdata.db')
    @pointdata_queue = Queue.new
    @ppd_db = SQLite3::Database.new('db/ppd.db')
    @analog_db = SQLite3::Database.new('db/analog.db')
    @analog_queue = Queue.new
    @meter_db = SQLite3::Database.new('db/meter.db')
    @meter_queue = Queue.new
    @meter_db_daily = SQLite3::Database.new('db/meter_daily.db')
    @meter_queue_daily = Queue.new
    @stat_db = SQLite3::Database.new('db/status.db')
    @schedule_db = SQLite3::Database.new('db/schedule.db')
    @room_stat_db = SQLite3::Database.new('db/room_stat.db')
    renew_pointdata_db
    init_db
    FileUtils.chmod_R(0777,Dir.glob("db"))
    # check old pointdata db
  end

  attr_accessor :enable

  def renew_pointdata_db
    begin
      sql = "SELECT MAX(datetime) from total_optime"
      @pointdata_db.execute(sql)
    rescue
      # old database exist then remove all data
      @pointdata_db.execute('DROP TABLE IF EXISTS optime')
      @pointdata_db.execute('DROP TABLE IF EXISTS ontimes')
    end
  end

  def close
    @pointdata_db.close
    @ppd_db.close
    @analog_db.close
    @meter_db.close
    @meter_db_daily.close
    @stat_db.close
    @schedule_db.close
    @room_stat_db.close
  end

  def init_db
    sql = "
      CREATE TABLE IF NOT EXISTS ppd (
        id,
        datetime,
        power,
        stop,
        UNIQUE (
          id,
          datetime
        ))"
    @ppd_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS latest (
        dev_id,
        datetime
        )"
    @ppd_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS optime (
        id,
        datetime,
        op_time,
        cool_op_time,
        heat_op_time,
        fan_op_time,
        th_on_time,
        UNIQUE (
          id,
          datetime
        ))"
    @pointdata_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS total_optime (
        id,
        datetime,
        op_time,
        cool_op_time,
        heat_op_time,
        fan_op_time,
        th_on_time,
        UNIQUE (
          id,
          datetime
        ))"
    @pointdata_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS ontimes (
        id,
        datetime,
        on_times,
        UNIQUE (
          id,
          datetime
        ))"
    @pointdata_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS total_ontimes (
        id,
        datetime,
        on_times,
        UNIQUE (
          id,
          datetime
        ))"
    @pointdata_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS meter (
        id,
        datetime,
        value,
        amount,
        UNIQUE (
          id,
          datetime
        ))"
    @meter_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS meter_daily (
        id,
        datetime,
        value,
        amount,
        UNIQUE (
          id,
          datetime
        ))"
    @meter_db_daily.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS analog (
        id,
        type,
        datetime,
        value,
        UNIQUE (
          id,
          type,
          datetime
        ))"
    @analog_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS status (
        id,
        stat
        )"
    @stat_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS schedule (
        owner,
        name,
        program
        )"
    @schedule_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS calendar (
        owner,
        calendar
        )"
    @schedule_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS pattern (
        owner,
        pattern
        )"
    @schedule_db.execute(sql)
    sql = "
      CREATE TABLE IF NOT EXISTS room_stat (
        id,
        stat,
        updated
        )"
    @room_stat_db.execute(sql)
  end

  def queue_stat
    "#{@pointdata_queue.length}"
  end

  def write_thread
    if(@enable == true)
      Thread.new do
        while(sql = @pointdata_queue.pop)
          @pointdata_db.transaction do
            begin
              loop {
                @pointdata_db.execute(sql)
                sql = @pointdata_queue.pop(true)
              }
            rescue
#             puts "Point data Queue Empty"
            end
          end
        end
      end

      Thread.new do
        while(sql = @meter_queue.pop)
          @meter_db.transaction do
            begin
              loop {
                @meter_db.execute(sql)
                sql = @meter_queue.pop(true)
              }
            rescue
#             puts "Meter DB Queue Empty"
            end
          end
        end
      end
      
      Thread.new do
        while(sql = @meter_queue_daily.pop)
          @meter_db_daily.transaction do
            begin
              loop {
                @meter_db_daily.execute_batch(sql)
                sql = @meter_queue_daily.pop(true)
              }
            rescue => e              
              #puts "Error meter_daily_queue pop: #{e}"
            end
          end
        end
      end

      Thread.new do
        while(sql = @analog_queue.pop)
          @analog_db.transaction do
            begin
              loop {
                @analog_db.execute(sql)
                sql = @analog_queue.pop(true)
              }
            rescue
#             puts "Analog DB Queue Empty"
            end
          end
        end
      end
    end
  end

  def clear_all
    sql = "DELETE FROM ppd"
    @ppd_db.execute(sql)
    sql = "DELETE FROM optime"
    @pointdata_db.execute(sql)
    sql = "DELETE FROM ontimes"
    @pointdata_db.execute(sql)
    sql = "DELETE FROM meter"
    @meter_db.execute(sql)
    sql = "DELETE FROM meter"
    @meter_db_daily.execute(sql)
    sql = "DELETE FROM analog"
    @analog_db.execute(sql)
    sql = "DELETE FROM status"
    @stat_db.execute(sql)
    sql = "DELETE FROM schedule"
    @schedule_db.execute(sql)
    sql = "DELETE FROM calendar"
    @schedule_db.execute(sql)
    sql = "DELETE FROM pattern"
    @schedule_db.execute(sql)
    sql = "DELETE FROM room_stat"
    @room_stat_db.execute(sql)
  end

  # delete entry before specified day
  def limit_database
  	date = Time.now.to_i - 3.1*365*24*60*60
    sql = "DELETE FROM ppd WHERE datetime <= #{date}"
    @ppd_db.execute(sql)
    sql = "DELETE FROM optime WHERE datetime <= #{date}"
    @pointdata_db.execute(sql)
    sql = "DELETE FROM ontimes WHERE datetime <= #{date}"
    @pointdata_db.execute(sql)
    date = Time.now.to_i - 1.1*365*24*60*60
    sql = "DELETE FROM analog WHERE datetime <= #{date}"
    @analog_db.execute(sql)
  	date = Time.now.to_i - 3.1*365*24*60*60
    sql = "DELETE FROM meter WHERE datetime <= #{date}"
    @meter_db.execute(sql)
    sql = "DELETE FROM meter_daily WHERE datetime <= #{date}"
    @meter_db_daily.execute(sql)
  end

  # read interface
  def read_ppd(from,to,id_array)
    ret = {}
    return ret if($ppd == false or @enable == false)
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM ppd #{cond}" # ORDER BY id, datetime"
    val = @ppd_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],data[3],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end
  def read_optime(from,to,id_array)
    ret = {}
    return ret if(@enable == false)
    # to prevent big data packet, check from and to difference
#    if(from < Time.new(2000,1,1,0,0))
#      date = @pointdata_db.execute("SELECT MIN(datetime) FROM optime")
#      from = Time.at(date[0][0]) if(date[0] != nil && date[0][0] !=nil)
#    end
#    to = from+(60*60*24*10) if(to-from > 60*60*24*10)
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM optime #{cond}" # ORDER BY id, datetime"
    val = @pointdata_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],data[3],data[4],data[5],data[6],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end
  def read_total_optime(id_array)
    ret = {}
    return ret if(@enable == false)
    # to prevent big data packet, check from and to difference
    cond = make_id_condition(id_array)
    sql = "SELECT * FROM total_optime #{cond}" # ORDER BY id, datetime"
    val = @pointdata_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],data[3],data[4],data[5],data[6],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end

  def read_ontimes(from,to,id_array)
    ret = {}
    return ret if(@enable == false)
    # to prevent big data packet, check from and to difference
#    if(from < Time.new(2000,1,1,0,0))
#      date = @pointdata_db.execute("SELECT MIN(datetime) FROM optime")
#      from = Time.at(date[0][0]) if(date[0] != nil && date[0][0] !=nil)
#    end
#    to = from+(60*60*24*10) if(to-from > 60*60*24*10)
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM ontimes #{cond}" # ORDER BY id, datetime"
    val = @pointdata_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end
  def read_total_ontimes(id_array)
    ret = {}
    return ret if(@enable == false)
    cond = make_id_condition(id_array)
    sql = "SELECT * FROM ontimes #{cond}" # ORDER BY id, datetime"
    val = @pointdata_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end

  def read_meter(from,to,id_array)
    ret = {}
    return ret if(@enable == false)
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM meter #{cond}" # ORDER BY id, datetime"
    val = @meter_db.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],data[3],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end
  def get_latest_value(id)
    sql = "SELECT MAX(datetime),value FROM meter WHERE id='#{id}'"
    begin
      val = @meter_db.execute(sql)
    rescue
      return nil
    end
    return nil if(val.length == 0 || val[0][1] == nil)
    return val[0][1]
  end
  def read_analog(from,to,id_array)
    ret = {}
    return ret if(@enable == false)
    # to prevent big data packet, check from and to difference
    if(from < Time.new(2000,1,1,0,0))
      date = @analog_db.execute("SELECT MIN(datetime) FROM analog")
      from = Time.at(date[0][0]) if(date[0] != nil && date[0][0] !=nil)
    end
    to = from+(60*60*24*10) if(to-from > 60*60*24*10)
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM analog #{cond}" # ORDER BY id, datetime"
    val = @analog_db.execute(sql)
    val.each do |data|
      if(id_array.include?(data[0]))
        ret[data[0]] = {} if(ret[data[0]] == nil)
        ret[data[0]][data[1]] = [] if(ret[data[0]][data[1]] == nil)
        ret[data[0]][data[1]] << [data[2],data[3],Time.at(data[2]).strftime('%Y%m%d%H%M').to_i]
      end
    end
    ret
  end

  ################################################################################
  # Kaiwei added new db functions 15/10/2018
  ################################################################################
  def read_analog3(from,to,id_array)
    ret = {}
    mpList = {}
    type = []
    return ret if(@enable == false)
    # to prevent big data packet, check from and to difference
    if(from < Time.new(2000,1,1,0,0))
      date = @analog_db.execute("SELECT MIN(datetime) FROM analog")
      from = Time.at(date[0][0]) if(date[0] != nil && date[0][0] !=nil)
    end
    #Kaiwei commented away because this only returns 10 days of data
    #to = from+(60*60*24*10) if(to-from > 60*60*24*10)
    cond = make_condition2(from,to,id_array)
    cond = cond + " ORDER BY DATETIME ASC;"
    sql = "SELECT id, type, datetime, value FROM analog #{cond}"  #ORDER BY id, datetime"
    val = @analog_db.execute(sql)
    return val
  end

  def make_condition2(from,to,id_array)
    cond = ""
    #if(id_array.size > 0 && id_array.size <= 20)
      cond = " (id='#{id_array[0]}'" 
      1.upto id_array.size-1 do |i|
        cond += " OR id='#{id_array[i]}'"
      end
      cond += ") AND"
    #end
    #cond += " (datetime>=#{from.to_i} AND datetime<=#{to.to_i})"
    cond += " (datetime>=#{from.to_i} AND datetime<#{to.to_i})"
    return ("WHERE"+cond)
  end
  
  def make_condition3(from,to,id_array)
    cond = ""
    #if(id_array.size > 0 && id_array.size <= 20)
      cond = " (id='#{id_array[0]}'" 
      1.upto id_array.size-1 do |i|
        cond += " OR id='#{id_array[i]}'"
      end
      cond += ") AND"
    #end
    #cond += " (datetime>=#{from.to_i} AND datetime<=#{to.to_i})"
    cond += " (datetime>=#{from.to_i} AND datetime<#{to.to_i})"
    return ("WHERE"+cond)
  end

  def read_meter_union_all(id_array,interval_list)
    #Use union all for small datasets eg. Day, Month queries for Energy and Water reports
    ret = []
    return ret if(@enable == false)
    sql = ""
    i=0
    while (i < interval_list.length)
      val = []
      temp = {}
      intervals = interval_list[i]
      fromdatetime = Time.at(intervals['datefrom'])
      todatetime = Time.at(intervals['dateto'])
      cond = make_condition3(fromdatetime,todatetime,id_array)
      cond = cond + " GROUP BY id"
      sql = sql + "SELECT id, datetime, null, null, SUM(amount) "
      sql = sql + " FROM meter A #{cond}" # ORDER BY id, datetime"
      if(i< interval_list.length-1)
        sql = sql + " UNION ALL "
      else
        sql = sql + " ORDER BY DATETIME, id ASC"
      end
      i+=1
    end
    
    begin
      val = @meter_db.execute(sql)
    rescue => e
      puts "Error Database: #{e}"
    end
    return val
  end
  
  def read_meter_daily(from,to,id_array)
    ret = {}
    return ret if(@enable == false)
    # adjust from and to time stamp to 0:00
    from = Time.new(from.year,from.month,from.day)
    to = Time.new(to.year,to.month,to.day)+60*60*24
    cond = make_condition(from,to,id_array)
    sql = "SELECT * FROM meter_daily #{cond}" # ORDER BY id, datetime"
    val = @meter_db_daily.execute(sql)
    val.each do |data|
      ret[data[0]] = [] if(ret[data[0]] == nil && id_array.include?(data[0]))
      ret[data[0]] << [data[1],data[2],data[3],Time.at(data[1]).strftime('%Y%m%d%H%M').to_i]
    end
    ret
  end

  def read_meter_daily2(id_array,interval_list)
    ret = []
    return ret if(@enable == false)
    sql = ""
    i=0
    while (i < interval_list.length)
      val = []
      temp = {}
      intervals = interval_list[i]
      fromdatetime = Time.at(intervals['datefrom'])
      todatetime = Time.at(intervals['dateto'])
      cond = make_condition3(fromdatetime,todatetime,id_array)
      cond = cond + " GROUP BY id"
      sql = sql + "SELECT id, datetime, null, null, SUM(amount) "
      sql = sql + " FROM meter_daily A #{cond}" # ORDER BY id, datetime"
      if(i< interval_list.length-1)
        sql = sql + " UNION ALL "
      else
        sql = sql + " ORDER BY DATETIME, id ASC"
      end
      i+=1
    end
    
    begin
      val = @meter_db_daily.execute(sql)
    rescue => e
      puts "Error Database: #{e}"
      end
    return val
  end
  
  def get_latest_meter_daily(id)
    sql = "SELECT MAX(datetime), value FROM meter_daily WHERE id='#{id}';"
    begin
      val = @meter_db_daily.execute(sql)
      return val if(val != nil)
    rescue => e
      puts "Error Database: #{e}"
    end
    return nil
  end
  
  def add_meter_daily2(id, time, value, amount)
    return if(@enable == false)
    return if(value == nil)
    db_time = Time.local(time.year,time.month,time.day,time.hour,time.min)
    sql = "INSERT INTO meter_daily VALUES ('#{id}',#{db_time.to_i},#{value},#{amount});"
    return sql
  end

  def update_meter_daily(id, time, value, amount)
    return if(@enable == false)
    return if(value == nil)
    db_time = Time.local(time.year,time.month,time.day,time.hour,time.min)
    sql = "UPDATE meter_daily SET value = #{value}, amount = #{amount} "
    sql = sql + "WHERE id= '#{id}' AND datetime = #{db_time.to_i};"
    return sql
  end
  
  def push_meter_daily(sql)
    @meter_queue_daily.push(sql)
  end
  
  def get_sum_amount_meter_daily(id, datefrom, dateto)
    begin
      sql = "SELECT SUM(amount) FROM meter WHERE id='#{id}' AND (datetime>=#{datefrom} AND datetime<#{dateto});"
      sum = @meter_db.execute(sql)
      return sum if(sum != nil)
    rescue => e
      puts "Error Database: #{e}"
    end
    return 0
  end
  
  def get_first_datetime_meter(id)
    sql = "SELECT MIN(datetime) FROM meter WHERE id='#{id}';"
    begin
      val = @meter_db.execute(sql)
      return val if(val != nil)
    rescue => e
      puts "Error Database: #{e}"
    end
    return nil
  end
  
  def read_point_data(from, to)
    ret = []
    return ret if(@enable == false)
    cond =  " WHERE (OPTIME.datetime>=#{from.to_i} AND OPTIME.datetime<#{to.to_i})"
    cond += " order by OPTIME.id, OPTIME.datetime"
    sql =  "SELECT OPTIME.id, OPTIME.datetime, OPTIME.op_time, OPTIME.cool_op_time, OPTIME.fan_op_time, 
                    OPTIME.heat_op_time, OPTIME.th_on_time,
                    TOTAL_OPTIME.op_time AS total_optime, TOTAL_OPTIME.cool_op_time AS total_cool_op_time, 
                    TOTAL_OPTIME.fan_op_time AS total_fan_op_time, 
                    TOTAL_OPTIME.heat_op_time AS total_heat_op_time, TOTAL_OPTIME.th_on_time AS total_th_on_time,
                    ONTIMES.on_times,
                    TOTAL_ONTIMES.on_times AS total_ontimes
             FROM 
             optime OPTIME
             LEFT JOIN total_optime TOTAL_OPTIME ON OPTIME.id = TOTAL_OPTIME.id
             LEFT JOIN ontimes ONTIMES ON OPTIME.id = ONTIMES.id AND OPTIME.datetime = ONTIMES.datetime
             LEFT JOIN total_ontimes TOTAL_ONTIMES ON OPTIME.id = TOTAL_ONTIMES.id 
             #{cond}" 
    ret = @pointdata_db.execute(sql)
    ret
  end

###############################################################################
  def make_condition(from,to,id_array)
    cond = ""
#    if(id_array.size > 0 && id_array.size <= 20)
      cond = " (id='#{id_array[0]}'" 
      1.upto id_array.size-1 do |i|
        cond += " OR id='#{id_array[i]}'"
      end
      cond += ") AND"
#    end

    cond += " (datetime>=#{from.to_i} AND datetime<#{to.to_i})"

    return ("WHERE"+cond)
  end

  def make_id_condition(id_array)
    cond = ""
    cond = " (id='#{id_array[0]}'" 
    1.upto id_array.size-1 do |i|
      cond += " OR id='#{id_array[i]}'"
    end
    cond += ")"
    return ("WHERE"+cond)
  end

  def make_key(time) # time: time_t
    Time.at(time).strftime('%Y%m%d%H%M')
  end

  # write interface
  # time shows data from time to time+1h
  def add_ppd(time, dev_id, data)
    return if(@enable == false)

    @ppd_db.transaction do
      data.each do |pid, ppd|
        sql = "INSERT INTO ppd VALUES ('#{pid}',#{time.to_i},#{ppd[0]},#{ppd[1]})"
        begin
          @ppd_db.execute(sql)
        rescue => e
          puts "ERROR: #{e}"
        end
      end
    end
  end
  def update_latest_ppd_time(dev_id,time)
    return if(@enable == false)
    sql = "SELECT * FROM latest WHERE dev_id='#{dev_id}'"
    ret = @ppd_db.execute(sql)
    if(ret.length == 0)
      sql = "INSERT INTO latest VALUES('#{dev_id}',#{time.to_i})"
    else
      sql = "UPDATE latest SET datetime=#{time.to_i} WHERE dev_id='#{dev_id}'"
    end
    @ppd_db.execute(sql)
  end
  def get_latest_ppd_time(dev_id)
    sql = "SELECT datetime FROM latest WHERE dev_id='#{dev_id}'"
    ret = @ppd_db.execute(sql)
    return nil if(ret.length == 0)
    return Time.at(ret[0][0])
  end

  # stored time shows data from time to time+15min
  def add_optime(id, time, op_time, cool=0, heat=0, fan=0, th_on=0)
    return if(@enable == false)
    db_time = Time.local(time.year,time.month,time.day,time.hour,time.min)-15*60
    day_time = Time.new(db_time.year,db_time.month,db_time.day)
    ret = @pointdata_db.execute("SELECT * FROM optime WHERE id='#{id}' AND datetime=#{day_time.to_i}")
    if(ret.length == 0 || (db_time.hour == 0 && db_time.min == 0))
      sql = "INSERT INTO optime VALUES ('#{id}',#{day_time.to_i},#{op_time.to_i},#{cool.to_i},#{heat.to_i},#{fan.to_i},#{th_on.to_i})"
    else
      sql = "UPDATE optime SET op_time=#{(op_time+ret[0][2]).to_i},cool_op_time=#{(cool+ret[0][3]).to_i},heat_op_time=#{(heat+ret[0][4]).to_i},fan_op_time=#{(fan+ret[0][5]).to_i},th_on_time=#{(th_on+ret[0][6]).to_i} WHERE id='#{id}' AND datetime=#{day_time.to_i}"
    end
    @pointdata_queue.push(sql)

    update_total_optime(id,db_time,op_time,cool,heat,fan,th_on)
  end

  def update_total_optime(id, time, op_time, cool, heat, fan, th_on)
    sql = ""
    begin
      sql = "SELECT * from total_optime WHERE id='#{id}'"
      ret = @pointdata_db.execute(sql)
      raise if(ret.length == 0)
      op_time += ret[0][2]
      cool += ret[0][3]
      heat += ret[0][4]
      fan += ret[0][5]
      th_on += ret[0][6]
      sql = "UPDATE total_optime SET datetime=#{time.to_i},op_time=#{op_time.to_i},cool_op_time=#{cool.to_i},heat_op_time=#{heat.to_i},fan_op_time=#{fan.to_i},th_on_time=#{th_on.to_i} WHERE id='#{id}'"
    rescue
      sql = "INSERT INTO total_optime VALUES ('#{id}',#{time.to_i},#{op_time.to_i},#{cool.to_i},#{heat.to_i},#{fan.to_i},#{th_on.to_i})"
    end
    @pointdata_queue.push(sql)
  end

  def add_ontimes(id, time, on_times)
    return if(@enable == false)
    db_time = Time.local(time.year,time.month,time.day,time.hour,time.min)-15*60
    day_time = Time.new(db_time.year,db_time.month,db_time.day)
    ret = @pointdata_db.execute("SELECT * FROM ontimes WHERE id='#{id}' AND datetime=#{day_time.to_i}")
    if(ret.length == 0 || (db_time.hour == 0 && db_time.min == 0))
      sql = "INSERT INTO ontimes VALUES ('#{id}',#{day_time.to_i},#{on_times})"
    else
      sql = "UPDATE ontimes SET on_times=#{(on_times+ret[0][2]).to_i} WHERE id='#{id}' AND datetime=#{day_time.to_i}"
    end
    @pointdata_queue.push(sql)

    update_total_ontimes(id,db_time,on_times)
  end

  def update_total_ontimes(id, time, on_times)
    sql = ""
    begin
      sql = "SELECT * from total_ontimes WHERE id='#{id}'"
      ret = @pointdata_db.execute(sql)
      raise if(ret.length == 0)
      on_times += ret[0][2]
      sql = "UPDATE total_ontimes SET datetime=#{time.to_i}, on_times=#{on_times.to_i} WHERE id='#{id}'"
    rescue
      sql = "INSERT INTO total_ontimes VALUES ('#{id}',#{time.to_i},#{on_times.to_i})"
    end
    @pointdata_queue.push(sql)
  end

  def add_meter(id, time, value, amount)
    return if(@enable == false)
    return if(value == nil)
    db_time = Time.local(time.year,time.month,time.day,time.hour,time.min)-15*60
    sql = "INSERT INTO meter VALUES ('#{id}',#{db_time.to_i},#{value},#{amount})"
    @meter_queue.push(sql)
  end
  
  # time shows data of the time
  def add_analog(id, type, time, value)
    return if(@enable == false)
    return if(value == nil)
    sql = "INSERT INTO analog VALUES ('#{id}','#{type}',#{time.to_i},#{value})"
    @analog_queue.push(sql)
  end

  ##############################################
  # get latest datetime
  # date is Time object
  def getLatestOptime
    sql = "SELECT MAX(datetime) from optime"
    begin
      val = @pointdata_db.execute(sql)
      return Time.at(val[0][0]) if(val[0][0] != nil)
    end
    return nil
  end

  def getLatestMeter
    sql = "SELECT MAX(datetime) from meter"
    begin 
      val = @meter_db.execute(sql)
      return Time.at(val[0][0]) if(val[0][0] != nil)
    end
    return nil
  end

  ##############################################
  # status db interface
  def add_id(id)
    sql = "INSERT INTO status VALUES('#{id}','')"
    @stat_db.execute(sql)
  end

  def registered?(id)
    sql = "SELECT stat FROM status WHERE id='#{id}'"
    ret = @stat_db.execute(sql)
    return false if(ret.length == 0)
    true
  end

  def get_status(id)
    sql = "SELECT stat FROM status WHERE id='#{id}'"
    ret = @stat_db.execute(sql)
    return nil if(ret.length == 0 or ret[0][0] == "")
    JSON.parse(ret[0][0])
  end

  # stat is hash of status
  def update_status(id,stat)
    val = JSON.generate(stat)
    sql = "UPDATE status SET stat='#{val}' WHERE id='#{id}'"
    @stat_db.execute(sql)
  end

  ##############################################
  # schedule db interface
  def add_program(name,owner)
    prog = JSON.generate({})
    sql = "SELECT name FROM schedule WHERE name='#{name}' and owner='#{owner}'"
    if(@schedule_db.execute(sql).length == 0)
      sql = "INSERT INTO schedule VALUES('#{owner}','#{name}','#{prog}')"
      @schedule_db.execute(sql)
    end
  end

  def rename_program(name,newname,owner)
    sql = "UPDATE schedule SET name='#{newname}' WHERE name='#{name}' AND owner='#{owner}'"
    @schedule_db.execute(sql)
  end

  def delete_program(name,owner)
    sql = "DELETE FROM schedule WHERE name='#{name}' AND owner='#{owner}'"
    @schedule_db.execute(sql)
  end

  def update_program(name,owner,program)
    prog = JSON.generate(program)
    sql = "UPDATE schedule SET program='#{prog}' WHERE name='#{name}' AND owner='#{owner}'"
    @schedule_db.execute(sql)
  end

  def get_all_program
    sql = "SELECT * FROM schedule"
    list = @schedule_db.execute(sql)
    list.each do |program|
      program[2] = JSON.parse(program[2])
    end
    list
  end

  def schedule_clear
    sql = "DELETE from schedule"
    @schedule_db.execute(sql)
  end

  def set_pattern(pattern,owner)
    pat = JSON.generate(pattern)
    sql = "SELECT * FROM pattern WHERE owner='#{owner}'"
    if(@schedule_db.execute(sql).length == 0)
      sql = "INSERT INTO pattern VALUES('#{owner}','#{pat}')"
    else
      sql = "UPDATE pattern SET pattern='#{pat}' WHERE owner='#{owner}'"
    end
    @schedule_db.execute(sql)
  end

  def get_all_pattern
    sql = "SELECT * FROM pattern"
    pat = @schedule_db.execute(sql)
    pat.each do |pattern|
      next if(pattern[0] == '')
      pattern[1] = JSON.parse(pattern[1])
    end
    pat
  end

  def set_calendar(calendar,owner)
    cal = JSON.generate(calendar)
    sql = "SELECT * FROM calendar WHERE owner='#{owner}'"
    if(@schedule_db.execute(sql).length == 0)
      sql = "INSERT INTO calendar VALUES('#{owner}','#{cal}')"
    else
      sql = "UPDATE calendar SET calendar='#{cal}' WHERE owner='#{owner}'"
    end
    @schedule_db.execute(sql)
  end

  def get_all_calendar
    sql = "SELECT * FROM calendar"
    cal = @schedule_db.execute(sql)
    cal.each do |calendar|
      next if(calendar[0] == '')
      calendar[1] = JSON.parse(calendar[1])
    end
    cal
  end

  ######################################################
  ## Room Stat DB
  ######################################################
  # return room status
  # if room is not registered then register and return false
  def get_room_stat(id)
    sql = "SELECT stat FROM room_stat WHERE id='#{id}'"
    stat = @room_stat_db.execute(sql)
    if(stat.length == 0 || stat[0].length == 0) # not registered yet
      sql = "INSERT INTO room_stat VALUES('#{id}','false','true')"
      @room_stat_db.execute(sql)
      stat = ['false']
    else
      sql = "UPDATE room_stat SET updated='true' WHERE id='#{id}'"
      @room_stat_db.execute(sql)
    end
    ret= false
    ret = true if(stat[0][0] == 'true')
    return ret
  end

  def remove_unupdated
    sql = "DELETE from room_stat WHERE updated='false'"
    @room_stat_db.execute(sql)
    sql = "UPDATE room_stat SET updated='false'"
    @room_stat_db.execute(sql)
  end

  def update_stat(id,stat)
    sql = "UPDATE room_stat SET stat='#{stat}' WHERE id='#{id}'"
    @room_stat_db.execute(sql)
  end

end