#coding: utf-8

require 'bigdecimal'
require_relative 'ManagementPoint'
require_relative 'DataManager'

class Pi < ManagementPoint
	def initialize(pid,dev_id)
		super
		# attribute of point
		@unit_label = ''
		@icon='PI.png'

		# point status
		@meter = nil
		@last_val = nil
    @cos = nil
	end

  attr_reader :meter

	def point_type
		'Pi'
	end
	
	# this method is for Pi to set latest value
	def set_db_value(db)
		@last_val = db.get_latest_value(id)
	end

	# get_attribute relate method
	def attribute
		super.merge({'unit_label'=>@unit_label})
	end

	# get_status relate method
	def current_status
		super.merge({'meter'=>@meter})
	end

	# set_attribute relate method
	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'unit_label'
				@unit_label = val
			end
		end
	end

	# update_status relate method
	def update_meter(val,cos)
    if(@children != nil)
      if(cos_ready?)
        new_val = val-child_val # clear @children data in child_val method
        if(@meter == nil || @meter < new_val)
          @meter = BigDecimal(new_val.to_s).floor(3).to_f 
          @last_val = @meter if(@last_val == nil)
          cos['meter'] = @meter if(@ready)
        end
        @cos = nil
      else
        @meter = 0 if(@meter == nil)
        @cos = val
      end
    else
      if(@parent != nil)
        parent = $data_man.point_list[@parent]
        parent.update_parent(val,id) if(parent != nil)
      end
      if(@meter == nil || @meter < val)
        cos['meter'] = val if(@ready)
        @meter = val
        @last_val = val if(@last_val == nil)  # initialize last_val at first update
      end
    end
	end

  def update_parent(val,id)
    cos = {}
    @children[id] = val
    if(@cos != nil && cos_ready?)
      new_val = @cos-child_val
      if(@meter == nil || @meter < new_val)
        @meter = new_val
        @last_val = @meter if(@last_val == nil)
        cos['meter'] = @meter 
        $data_man.comm_man.cos(self.id,cos)
      end
      @cos = nil
    end
  end

  def cos_ready?
    @children.each do |id,data|
      return false if(data == nil)
    end
    return true
  end

  def child_val
    val = 0
    @children.each do |id,data|
      val += data if(data != nil)
      @children[id] = nil
    end
    return val
  end

	def store_running_data(time,db)
    return if(@meter == nil || @last_val == nil)
		amount = @meter-@last_val
		@last_val = @meter
		db.add_meter(id,time,@meter,amount)
    #########################################################
    # Kaiwei added function for inserting into meter_daily
    db.push_meter_daily(get_update_sql(id,time,db,amount))
    #########################################################
	end
	
	#Kaiwei added storing daily data 17/10/2018
  def get_insert_sql(time,db)
    begin
      #get latest time
      sql = ""
      time = time.to_i if(time != nil)
      val = db.get_latest_meter_daily(id)
      if(val[0][0] == nil) # if no data in meter_daily
        firstMeterDatetime = db.get_first_datetime_meter(id)
        if(firstMeterDatetime[0][0] == nil)
          return ""
        else
          tmpTime = (Time.at(firstMeterDatetime[0][0]))
          dbDatetime = (Time.new(tmpTime.year, tmpTime.month, tmpTime.day)).to_i
          value = 0
        end
      else
        dbDatetime = val[0][0] if(val[0][0] != nil)
        dbDatetime += 86400
        value = val[0][1]
      end
      # - dbDatetime stores the last datetime of the record in meter_daily
      #   eg. 01 Oct will store the sum amount of 01 Oct 00:00 to 01 Oct 23:45
      # - First if will populate any missing data from meter_daily 
      #   in case SVM is shutdown over weekend or meter_daily is created for the first time
      if(((time - dbDatetime)/86400).floor > 0) # more than 2 days
        #for each interval, for each id, get sum(amount) from meter 
        while (dbDatetime+86400 < time)
          dbSum = db.get_sum_amount_meter_daily(id, dbDatetime, dbDatetime+86400)
          if(dbSum[0][0] != nil)
            amount = dbSum[0][0]
          else
            amount = 0
          end
          value = value + amount
          insertTime = Time.at(dbDatetime)
          sql = sql + db.add_meter_daily2(id, insertTime, value, amount)
          dbDatetime += 86400
        end
      # update meter_daily 
      end  
      tmpTime = Time.at(time)
      tmpTime2 = (Time.new(tmpTime.year, tmpTime.month, tmpTime.day)).to_i
      dbSum = db.get_sum_amount_meter_daily(id, tmpTime2, time)
      if(dbSum[0][0] != nil)
        amount = dbSum[0][0]
      else
        amount = 0
      end
      value = value + amount
      insertTime = Time.at(tmpTime2)
      
      if(tmpTime2>=dbDatetime)
         #INSERT
        sql = sql + db.add_meter_daily2(id, insertTime, value, amount)
      else 
        sql = sql + db.update_meter_daily(id, insertTime, @last_val, amount)
      end
    rescue => e
      puts "Error Pi.rb: #{e}"
    end
    return sql
  end

  def get_update_sql(id,time,db,amount)
    time = Time.local(time.year,time.month,time.day,time.hour,time.min)-15*60
    begin
      #get latest time
      sql = ""
      time = time.to_i if(time != nil)
      val = db.get_latest_meter_daily(id)
      if(val[0][0] == nil) # if no data in meter_daily
        dbDatetime = time
        value = 0
      else
        dbDatetime = val[0][0] if(val[0][0] != nil)
        dbDatetime += 86400
        value = val[0][1]
      end
      tmpTime = Time.at(time)
      tmpTime2 = (Time.new(tmpTime.year, tmpTime.month, tmpTime.day)).to_i
      dbSum = db.read_meter_daily(id, tmpTime2, time)
      if(dbSum!= nil && dbSum!=0 && dbSum[0][0] != nil)
        amount = amount + dbSum[0][0]
      else
        #amount = 0
      end
      value = value + amount
      insertTime = Time.at(tmpTime2)
      
      if(tmpTime2>=dbDatetime)
         #INSERT
        sql = sql + db.add_meter_daily2(id, insertTime, value, amount)
      else 
        sql = sql + db.update_meter_daily(id, insertTime, @last_val, amount)
      end
      
    rescue => e
      puts "Error Pi.rb: #{e}"
    end
    return sql
  end
end
