package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:contextdb;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.hibernate.ddl-auto=create-drop",
	"spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost/.well-known/jwks.json"
})
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
