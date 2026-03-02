package com.example.demo.repositories;

import com.example.demo.models.CV;
import com.example.demo.models.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class CVRepositoryIntegrationTest {

    @Autowired
    private CVRepository cvRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUser_whenCvExists_returnsUserCv() {
        User user = saveUser("u1", "u1@example.com");
        CV cv = new CV();
        cv.setUser(user);
        cv.setProfession("Backend Engineer");
        cv.setContactEmail("u1@example.com");
        cv.setSkills(List.of("Java", "Spring"));
        cvRepository.saveAndFlush(cv);

        Optional<CV> found = cvRepository.findByUser(user);

        assertThat(found).isPresent();
        assertThat(found.get().getProfession()).isEqualTo("Backend Engineer");
        assertThat(found.get().getSkills()).containsExactly("Java", "Spring");
    }

    @Test
    void findByUser_whenCvMissing_returnsEmpty() {
        User user = saveUser("u2", "u2@example.com");

        Optional<CV> found = cvRepository.findByUser(user);

        assertThat(found).isEmpty();
    }

    @Test
    void findByUser_doesNotReturnOtherUsersCv() {
        User firstUser = saveUser("u3", "u3@example.com");
        User secondUser = saveUser("u4", "u4@example.com");

        CV cv = new CV();
        cv.setUser(firstUser);
        cv.setProfession("Platform Engineer");
        cvRepository.saveAndFlush(cv);

        Optional<CV> foundForSecondUser = cvRepository.findByUser(secondUser);

        assertThat(foundForSecondUser).isEmpty();
    }

    private User saveUser(String id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName("Test User " + id);
        user.setPublic(false);
        return userRepository.saveAndFlush(user);
    }
}
