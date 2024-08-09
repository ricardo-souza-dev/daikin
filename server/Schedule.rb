#coding: utf-8

# structure of pattern and calendar
# pattern
# {name:
#	 [{'time':time(min from 0:00),
#	  'action':{com:action,...}},
#		 {},...],
#	name:[],...}
# 
# Calendar
# {name:
#		{month:[{'type':type,	(type: 'date'/'dow')
#		 'date':date,
#		 'day':day of week,	(mon,tue,...)
#		 'week':week (1,2,3,4,'last')},...],
#		 month:[],...}
#	 name:{},...
#	}

# schedule program
# {name:
#		['enable':true/false,
#	 	 'target':[target points],
#	 	 'schedule':{schedule list}
#		],
#  name:[],...}
# 
# schedule list
# {name: <-- pattern name
#		{'wd':[day of week],
#	 	 'spd':[calendar]},
#  name: {},...}

require 'date'
require_relative 'DataManager'

class Schedule
	def initialize(clock,data_man)
		@program_list = {} 	# {owner=>{name=>program,...},...}
		@calendar = {}			# {owner=>calendar,...}
		@pattern_list = {}	# {owner=>pattern_list,...}
		@week = ['sun','mon','tue','wed','thu','fri','sat']
		@clock = clock
		@data_man = data_man

		prog = @data_man.get_file("schedule.json")
		if(prog != nil)
			@program_list = prog["program"]
			@calendar = prog["calendar"]
			@pattern_list = prog["pattern"]
		end
	end

	attr_reader :program_list, :calendar, :pattern_list, :clock

	def save_schedule
		@data_man.save_file("schedule.json",{"program"=>@program_list,"calendar"=>@calendar,"pattern"=>@pattern_list})
	end

	# interface for UI
	def add_program(name, owner)
		prog = []
		if(@program_list[owner] == nil)
			@program_list[owner] = {name=>prog}
		elsif(@program_list[owner][name] == nil)
			@program_list[owner][name] = prog
		else # name is already registered
			return false
		end
		save_schedule
		return true
	end

	# program: [true/false(enable),[target id list],{program list}]
	def set_program(name,owner,program)
		if(@program_list[owner] != nil)
			if(@program_list[owner][name] != nil)
				@program_list[owner][name] = program
				save_schedule
				init_schedule_program(name,owner)
				return true
			end
		end
		return false
	end

	def delete_program(name,owner)
		if((list = @program_list[owner]) != nil)
			del = list.delete(name)
			# clear schedule from time slot
			from,to = make_period(@clock.get_time)
			@clock.clear_schedule_program(from,to,name,owner)
			# delete schedule from database
			save_schedule
			return true
		end
		return false
	end

	def rename_program(name, newname, owner)
		if((list = @program_list[owner]) != nil)
			if((prog = list.delete(name)) != nil)
				@program_list[owner][newname] = prog
				save_schedule
				puts "SCHED LIST: #{@program_list[owner]}"
				return true
			end
		end
		return false
	end

	def get_program(owner)
		begin
			return @program_list[owner]
		rescue
			nil
		end
	end

	def set_pattern(pattern_list,owner)
		# pattern_list is a hash of pattern of a day
		@pattern_list[owner] = pattern_list
		# store new pattern list to database
		save_schedule
		init_schedule_all
		return true
	end
	def get_pattern_list(owner)
		begin
			@pattern_list[owner]
		rescue
			return nil
		end
	end
	def get_pattern(name,owner)
		begin
			@pattern_list[owner][name]
		rescue
			return nil
		end
	end

	def set_calendar(calendar,owner)
		@calendar[owner] = calendar
		# store new calendar to database
		save_schedule
		init_schedule_all
		return true
	end
	def get_calendar_list(owner)
		begin
			return @calendar[owner]
		rescue
			return nil
		end
	end
	def get_calendar(name,owner)
		begin
			@calendar[owner][name]
		rescue
			return nil
		end
	end

	def get_day_of_week(index) # 0 is sunday
		@week[index]
	end

	# interface for logic
	# initialize all schedule program within 2 hours
	def init_schedule_all
		# clear schedule within 2 hours
		from,to = make_period(@clock.get_time)
		if(to.hour == 1) # 23:00 to 1:00
			dc = Time.new(to.year,to.month,to.day,0)
			@clock.clear_schedule(from,dc)
			@program_list.each do |owner,sched|
				sched.each_key do |name|
					set_specified_program(from,dc,name,owner)
				end
			end
			@clock.clear_schedule(dc,to)
			@program_list.each do |owner,sched|
				sched.each_key do |name|
					set_specified_program(dc,to,name,owner)
				end
			end
		else
			@clock.clear_schedule(from,to)
			@program_list.each do |owner,sched|
				sched.each_key do |name|
					set_specified_program(from,to,name,owner)
				end
			end
		end
	end

	# initialzie specified schedule program within 2 hours
	def init_schedule_program(name,owner)
		# clear schedule within 2 hours
		from,to = make_period(@clock.get_time)
		if(to.hour == 1) # 23:00 to 1:00
			dc = Time.new(to.year,to.month,to.day,0)
			@clock.clear_schedule_program(from,dc,name,owner)
			set_specified_program(from,dc,name,owner)
			@clock.clear_schedule_program(dc,to,name,owner)
			set_specified_program(dc,to,name,owner)
		else
			@clock.clear_schedule_program(from,to,name,owner)
			set_specified_program(from,to,name,owner)
		end
	end


	def set_specified_program(from,to,name,owner)
		program = @program_list[owner][name]
		return false if(program['enable'] == false)	# program is disable
		return false if(program['target'].length == 0) # target is empty
		patn = find_target_pattern(from,to,program,owner)
		set_actions(from,to,program['target'],patn,name,owner) if(patn != nil)
		return true
	end

	# return a pattern which should work on the day
	# from and to have to belong to the same day
	def find_target_pattern(from,to,program,owner)
		target_wd = nil

		program['schedule'].each do |patn,days|
			return patn if(is_special_day?(from,days['spd'],owner))
			target_wd = patn if(target_wd == nil && is_target_day?(from,days['wd']))
		end
		return target_wd
	end

	def set_actions(from,to,target,patn,name,owner)
		puts "Set Action: #{patn} #{from}"
		actions = get_actions_within_time(from,to,get_pattern(patn,owner))
		# set pattern to time slot
		actions.each do |an_act|
			set_action(an_act['time'],an_act['action'],target,name,owner)
		end
	end

	# action: {'com'=>'val'}
	# target: [id,id]
	def set_action(time,action,target,name,owner)
		hour = time/60
		min = time%60
		com = {}
		target.each do |id|
			com[id] = [action,name,owner]
		end
		@clock.add_action(hour,min,com,'schedule')
	end	

	def get_actions_within_time(from,to,pattern)
		if(from == nil)
			from = 0
		else
			from = from.hour*60+from.min
		end
		to = to.hour*60
		to = 24*60 if(from > to)
		ret = []

		if(pattern != nil)
			pattern.each do |action|
				ret << action if(action['time'] >= from && action['time'] < to)
			end
		end
		return ret
	end

	def is_special_day?(time,special_day,owner)
		return false if(special_day == nil || special_day.length == 0)
		now = time
		month = now.month
		date = now.day
		dow = get_day_of_week(now.wday)
		week = (date-1)/7+1
		week = 'last' if((now+6*24*60*60).month != month)

		special_day.each do |cal|
			spd = get_calendar(cal,owner)
			next if(spd == nil)
			next if(spd[month.to_s] == nil)
			spd[month.to_s].each do |day|
				if(day['type'] == 'date')
					return true if(day['date'] == date)
				else
					return true if(day['day'] == dow && day['week'] == week)
				end
			end
		end
		return false
	end

	def is_target_day?(time,weekly)
		return false if(weekly == nil || weekly.length == 0)
		now = time
		dow = get_day_of_week(now.wday)
		return true if(weekly.index(dow) != nil)
		return false
	end

	# this method should be called every hour to update schedule
	def update_schedule_all
		# clear schedule of 1 hour later
		from,to = make_period(@clock.get_time)
		from = from+60*60
		from = Time.new(from.year,from.month,from.day,from.hour)

		@clock.clear_schedule(from,to)
		@program_list.each do |owner,sched|
			sched.each_key do |name|
				set_specified_program(from,to,name,owner)
			end
		end
	end

	def make_period(time)
		period = 2 	# within 2 hours
		to = time+period*60*60
		to = Time.new(to.year,to.month,to.day,to.hour)
		return time,to
	end
end
