package com.example.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class DemoApplication {

	private static final Logger log = LoggerFactory.getLogger(DemoApplication.class);

	public static void main(String[] args) {
		ConfigurableApplicationContext context = SpringApplication.run(DemoApplication.class, args);
		Environment environment = context.getEnvironment();

		String appName = environment.getProperty("spring.application.name", "demo");
		String serverPort = environment.getProperty("server.port", "8080");
		log.info("Application '{}' started on port {}", appName, serverPort);
	}

}
 
