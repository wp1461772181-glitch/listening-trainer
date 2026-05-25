package com.listeningtrainer;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.listeningtrainer.mapper")
public class ListeningTrainerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ListeningTrainerApplication.class, args);
    }
}
