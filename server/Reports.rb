#coding: utf-8

require 'json'
require 'date'
#require_relative 'DataManager'
#require 'csv'

class Reports
  def initialize(data_man)
    begin
      init_report_types(data_man)
      init_categorized_pi(data_man)
      init_pi_categories(data_man)
    end
    rescue => e
      puts "Error: #{e}"
  end
    
	def init_report_types(data_man)
		@reports_file = 'reports.json'
		
		@data_man = data_man
		
		if(File.exist?(@reports_file))
		else
			@reports = File.new(@reports_file, "w") 
			
			tempHash = {'repor' => []}
			
			File.open(@reports_file,'w') do |f|
				f.write(tempHash.to_json)
			end
		end			
		
		begin
			@reports = File.read(@reports_file)
			@reports_type = JSON.parse(@reports)
		rescue => e
			puts "Error: #{e}"
			return false
		end
	end
	
 def get_report_types(owner)
    begin
      reportsProgram = {'reportTypes' => Array.new}
      @reports_type['reportTypes'].each do |rep|  
          reportsProgram['reportTypes'] << rep
      end
      return reportsProgram
    rescue => e
      puts "Error in getting report types!"
      puts "Error: #{e}"
    end
  end
  
  def get_start_date(owner)
    begin
      @reports = File.read(@reports_file)
      @reports_type = JSON.parse(@reports)
      reportsProgram = {'startDate' => Array.new}
      @reports_type['startDate'].each do |rep|  
        reportsProgram['startDate'] << rep
      end
      return reportsProgram
    rescue => e
      puts "Error in getting start date and month!"
      puts "Error: #{e}"
    end
  end
  
  def get_bei_regulations(owner)
      begin
        @reports = File.read(@reports_file)
        @reports_type = JSON.parse(@reports)
        reportsProgram = {'beiRegulations' => Array.new}
        @reports_type['beiRegulations'].each do |rep|  
          reportsProgram['beiRegulations'] << rep
        end
        return reportsProgram
      rescue => e
        puts "Error in getting start date and month!"
        puts "Error: #{e}"
      end
    end
  
  def init_categorized_pi(data_man)
    @pi_file = 'categorizedPiType.json'
    @data_man = data_man
        
    if(File.exist?(@pi_file))
    else
      @pi = File.new(@pi_file, "w") 
      #tempHash = {'pi' => []}
      tempHash = {"categorizedPiType"=> []}
      File.open(@pi_file,'w') do |f|
        f.write(tempHash.to_json)
      end
    end     
    File.chmod(0777,@pi_file)          
    begin
      @pi = File.read(@pi_file)
      @pi_type = JSON.parse(@pi)
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end
  
  def get_categorized_pi(owner)
    begin
      @pi = File.read(@pi_file)
      @pi_type = JSON.parse(@pi)
      categorizedPiProgram = {'categorizedPiType' => Array.new}
      @pi_type['categorizedPiType'].each do |rep|  
        categorizedPiProgram['categorizedPiType'] << rep
      end
      return categorizedPiProgram
    rescue => e
      puts "Error in getting power input data!"
      puts "Error: #{e}"
    end
  end
    
  def init_pi_categories(data_man)
    @cat_file = 'piCategories.json'
    @data_man = data_man
        
    if(File.exist?(@cat_file))
    else
      @pi_cat = File.new(@cat_file, "w") 
      #tempHash = {'pi' => []}
      tempHash = {"isEnergyEnabled" => true,
                  "Energy"=> [{"id"=> 101,"owner"=> "","type"=> "","isEnabled"=> true},
                              {"id"=> 102,"owner"=> "","type"=> "","isEnabled"=> true},
                              {"id"=> 103,"owner"=> "","type"=> "","isEnabled"=> true}],
                  "Energy_Generator"=> [{"id"=> 201,"owner"=> "","type"=> "Energy_Generator","isEnabled"=> true}],
                  "Water_Consumption"=> [{"id"=> 301,"owner"=> "","type"=> "Water_Consumption","isEnabled"=> true}],
                  "Recycled_Water"=> [{"id"=> 401,"owner"=> "","type"=> "Recycled_Water","isEnabled"=> true}],
                  "Total"=> [{"id"=> 901,"owner"=> "","type"=> "Total","isEnabled"=> true}]}
      File.open(@cat_file,'w') do |f|
        f.write(tempHash.to_json)
      end
    end     
    File.chmod(0777,@pi_cat)
    begin
      @pi_cat = File.read(@cat_file)
      @cat = JSON.parse(@pi_cat)
    rescue => e
      puts "Error: #{e}"
      return false
    end
  end
    
  def get_pi_categories(owner)
    begin
      @pi_cat = File.read(@cat_file)
      @cat = JSON.parse(@pi_cat)
      return @cat
    rescue => e
      puts "Error in getting categories data!"
      puts "Error: #{e}"
    end
  end
end