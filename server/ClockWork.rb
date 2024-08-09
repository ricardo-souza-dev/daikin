#coding: utf-8

class ClockWork
	def initialize(data_man = nil)
		@now = nil
		@time_slot = Array.new(24*60)
		@data_man = data_man
		@last_sec = -1
		@last_min = -1
		@last_hour = -1
		@last_day = -1
		0.upto 24*60-1 do |i|
			@time_slot[i] = {'schedule'=>[],'offtimer'=>[],'offdelay'=>[]}
		end
	end

	attr_accessor :now, :time_slot

	def start
		Thread.new do
			loop {
				@now = Time.now
				every_min
				every_hour
				every_day
				sleep 0.5
			}
		end
	end

	def add_action(hour,min,command,type)
		# command is {id=>[{action},from,who],...}
		# type is schedule or offtimer
		index = hour*60+min 
		#puts "add action #{hour} #{min} #{index} #{command}"
		@time_slot[index][type] << command
	end

	def cancel_action(hour,min,command,type)
		index = hour*60+min 
		#puts "cancel action #{hour} #{min} #{index} #{command}"
		@time_slot[index][type].delete(command)
	end

	def clear_schedule(from,to)
		tic = from.hour*60+from.min
		end_t = to.hour*60
		end_t = 24*60 if(end_t == 0)
		while tic < end_t do
			@time_slot[tic]['schedule'] = []
			tic = tic+1
		end
	end

	def clear_schedule_program(from,to,name,owner)
		tic = from.hour*60+from.min
		end_t = to.hour*60
		end_t = 24*60 if(end_t == 0)
		sched = []
		while tic < end_t do
			@time_slot[tic]['schedule'].each do |prog|
				sched << prog if(prog[1] == name && prog[2] == owner)
			end
			@time_slot[tic]['schedule'] = @time_slot[tic]['schedule'] - sched
			tic = tic+1
		end
	end

	def rename_schedule_program(hour,new_name,name,owner)
		index = hour*60
		0.upto 59 do |i|
			@time_slot[index+i]['schedule'].each do |prog|
				prog[1] = new_name if(prog[1] == name && prog[2] == owner)
			end
		end
	end

	def get_time
		return Time.at(Time.now.to_i) if(@now == nil)
		Time.at(@now.to_i)
	end

	def get_min_time
		time = @now
		time = Time.now if(time == nil)
		Time.at(time.to_i/60.to_i*60)
	end

	def time_slot_check
		index = @now.hour*60+@now.min
		exec = @time_slot[index]
		#puts "time slot #{exec}"
		# exec is command array
		if(exec['schedule'].size > 0 || exec['offtimer'].size > 0 || exec['offdelay'].size > 0)
			puts "#{index} #{exec}"
			if(exec['schedule'].size > 0)
				@data_man.add_history('schedule',['sched_exec'])
			end
			if(exec['offtimer'].size > 0)
				 @data_man.add_history('offtimer',['offtimer_exec'])
			end
			# offdelay history does not store history
			com_array = exec['schedule']+exec['offtimer']+exec['offdelay']
			Thread.new do @data_man.time_exec(com_array) end if(@data_man != nil)
			@time_slot[index]['schedule'] = []
			@time_slot[index]['offtimer'] = []
			@time_slot[index]['offdelay'] = []
			return true
		end
		false
	end

	def every_min
		min = @now.min
		return false if(@last_min == min or @now.sec < 2) 	# it should work 2sec or later
		Thread.new do @data_man.every_min_exec end if(@data_man != nil)
		time_slot_check
		@last_min = min
		true
	end

	def every_hour 	# every 3min will work
		return false if(@last_hour == @now.hour)
		return false if(@now.min != 3 or @now.sec < 5) 	# it should work 5sec or later
		Thread.new do @data_man.every_hour_exec end if(@data_man != nil)
		@last_hour = @now.hour
		true
	end

	def every_day
		return false if(@last_day == @now.day)
		return false if(@now.hour != 0 or @now.min < 3 or @now.sec < 10)
		# it will work 0:3:10 or later
		Thread.new do @data_man.every_day_exec end if(@data_man != nil)
		@last_day = @now.day
		true
	end

	def peek_time_slot(hour,min)
		index = hour*60+min 
		return @time_slot[index]
	end
end

class ClockWorkAccel < ClockWork
	# time_step can be 1,2,4,5,10,20,30,60
	def initialize(data_man = nil, time_step = 5)
		super(data_man)
		@time_step = time_step
	end

	def start
		puts "clock is started"
		Thread.new do
			now = Time.now
			@now = Time.local(now.year,now.month,now.day,now.hour,now.min,5)
			puts "Start from #{@now}"
			loop {
				every_min
				every_hour
				sleep 0.5
				@now += @time_step
			}
		end
	end	
end

class ClockWorkTest < ClockWork
	def initialize(year,month,day,hour,min)
		super(nil)
		@now = Time.new(year,month,day,hour,min)
	end

	def set_time(year,month,day,hour,min)
		@now = Time.new(year,month,day,hour,min)
	end
end