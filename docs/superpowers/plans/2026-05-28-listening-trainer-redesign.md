# Listening Trainer 听力训练模式重构 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将听写模式改造为"逐句填空"模式，回顾模式添加"原文+音频同步高亮"功能

**Architecture:** 后端新增 Lesson/LessonSentence/PracticeRecord/PracticeAnswer 四张表，用 Stanford CoreNLP 做词性标注自动挖空；前端新增上传校对页、改造练习页和回顾页。音频按句独立生成 MP3 存储。

**Tech Stack:** Spring Boot 3.3 + MyBatis-Plus + MySQL, React + TypeScript + Vite + react-router v6, Stanford CoreNLP, 百度 TTS

---

## File Map

### Backend — New Files

| File | Responsibility |
|------|---------------|
| `entity/Lesson.java` | Lesson 实体 |
| `entity/LessonSentence.java` | LessonSentence 实体 |
| `entity/PracticeRecord.java` | PracticeRecord 实体 |
| `entity/PracticeAnswer.java` | PracticeAnswer 实体 |
| `mapper/LessonMapper.java` | Lesson Mapper |
| `mapper/LessonSentenceMapper.java` | LessonSentence Mapper |
| `mapper/PracticeRecordMapper.java` | PracticeRecord Mapper |
| `mapper/PracticeAnswerMapper.java` | PracticeAnswer Mapper |
| `dto/LessonUploadRequest.java` | 上传文本请求 DTO |
| `dto/LessonSentenceEdit.java` | 句子校对 DTO |
| `dto/LessonResponse.java` | 课程响应 DTO |
| `dto/LessonSentenceResponse.java` | 句子响应 DTO |
| `dto/PracticeSubmitRequest.java` | 练习提交请求 DTO |
| `dto/PracticeCompleteResponse.java` | 练习完成响应 DTO |
| `dto/SentencePracticeInfo.java` | 单句练习信息 DTO |
| `service/SentenceSplitter.java` | Stanford CoreNLP 句子切分+词性标注服务 |
| `service/LessonService.java` | 课程管理业务逻辑 |
| `service/PracticeService.java` | 练习业务逻辑（替代旧 ProgressService 的部分功能） |
| `controller/LessonController.java` | 课程管理 API（替换旧 LessonController） |
| `controller/PracticeController.java` | 练习 API（新） |

### Backend — Modified Files

| File | Change |
|------|--------|
| `dto/PracticeDetailResponse.java` | 增加 `sentenceText` 和 `lessonTitle` 字段 |
| `service/ProgressService.java` | 改造 `getProgressDetail` 返回新版回顾数据 |
| `controller/ProgressController.java` | 不改，保持兼容 |
| `resources/schema.sql` | 添加新表 DDL |
| `pom.xml` | 添加 Stanford CoreNLP 依赖 |

### Frontend — New Files

| File | Responsibility |
|------|---------------|
| `src/routes/LessonsPage.tsx` → 重写 | 课程列表页，支持状态徽章 |
| `src/routes/LessonCreatePage.tsx` | 上传+校对页 |
| `src/routes/ReviewPage.tsx` | 回顾页（左右分栏） |
| `src/components/SentenceEditor.tsx` | 句子校对组件 |
| `src/components/ClozeRenderer.tsx` | 挖空渲染组件 |
| `src/components/OriginalTextPanel.tsx` | 回顾左侧原文面板 |
| `src/components/AnswerPanel.tsx` | 回顾右侧答案面板 |
| `src/components/StatusBadge.tsx` | 课程状态徽章 |

### Frontend — Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | 新增 Lesson/Sentence/Cloze/PracticeRecord 类型 |
| `src/lib/api.ts` | 新增课程管理/练习/回顾 API 调用 |
| `src/lib/router.tsx` | 新增路由 `/lessons`, `/lessons/new`, `/history/:recordId/review` |
| `src/routes/PlayerPage.tsx` | 重写为新版逐句填空练习页 |
| `src/routes/HomePage.tsx` | 更新"创建课程"按钮指向 `/lessons/new` |
| `src/context/ProgressContext.tsx` | 适配新 API |

---

## Phase 1: Backend — Database + Entities + Mappers

### Task 1: Database Schema + CoreNLP Dependency

**Files:**
- Modify: `backend/src/main/resources/schema.sql`
- Modify: `backend/pom.xml`

- [ ] **Step 1: Add new table DDL to schema.sql**

Append to `backend/src/main/resources/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS lesson (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    hint TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'drafting',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS lesson_sentence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT NOT NULL,
    sentence_index INT NOT NULL,
    text TEXT NOT NULL,
    audio_path VARCHAR(500),
    voice VARCHAR(10) DEFAULT 'male',
    blanks_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lesson_id (lesson_id)
);

CREATE TABLE IF NOT EXISTS practice_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lesson_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    listen_count INT DEFAULT 0,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_lesson_id (lesson_id)
);

CREATE TABLE IF NOT EXISTS practice_answer (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT NOT NULL,
    sentence_id BIGINT NOT NULL,
    sentence_text TEXT NOT NULL,
    user_answer TEXT,
    blanks_json TEXT,
    INDEX idx_record_id (record_id)
);
```

- [ ] **Step 2: Add Stanford CoreNLP dependency to pom.xml**

Add inside `<dependencies>` block in `backend/pom.xml`:

```xml
<!-- Stanford CoreNLP -->
<dependency>
    <groupId>edu.stanford.nlp</groupId>
    <artifactId>stanford-corenlp</artifactId>
    <version>4.5.7</version>
</dependency>
<dependency>
    <groupId>edu.stanford.nlp</groupId>
    <artifactId>stanford-corenlp</artifactId>
    <version>4.5.7</version>
    <classifier>models</classifier>
</dependency>
```

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/resources/schema.sql backend/pom.xml
git commit -m "feat: add new tables and CoreNLP dependency for sentence-based lessons"
```

---

### Task 2: Backend Entities

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/entity/Lesson.java`
- Create: `backend/src/main/java/com/listeningtrainer/entity/LessonSentence.java`
- Create: `backend/src/main/java/com/listeningtrainer/entity/PracticeRecord.java`
- Create: `backend/src/main/java/com/listeningtrainer/entity/PracticeAnswer.java`

- [ ] **Step 1: Create Lesson.java**

```java
package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("lesson")
public class Lesson {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String title;
    private String difficulty;
    private String hint;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 2: Create LessonSentence.java**

```java
package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("lesson_sentence")
public class LessonSentence {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long lessonId;
    private Integer sentenceIndex;
    private String text;
    private String audioPath;
    private String voice;
    private String blanksJson;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public Integer getSentenceIndex() { return sentenceIndex; }
    public void setSentenceIndex(Integer sentenceIndex) { this.sentenceIndex = sentenceIndex; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
    public String getBlanksJson() { return blanksJson; }
    public void setBlanksJson(String blanksJson) { this.blanksJson = blanksJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
```

- [ ] **Step 3: Create PracticeRecord.java**

```java
package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("practice_record")
public class PracticeRecord {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long lessonId;
    private Long userId;
    private Integer score;
    private Integer listenCount;
    private LocalDateTime completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getListenCount() { return listenCount; }
    public void setListenCount(Integer listenCount) { this.listenCount = listenCount; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
```

- [ ] **Step 4: Create PracticeAnswer.java**

```java
package com.listeningtrainer.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("practice_answer")
public class PracticeAnswer {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long recordId;
    private Long sentenceId;
    private String sentenceText;
    private String userAnswer;
    private String blanksJson;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public String getSentenceText() { return sentenceText; }
    public void setSentenceText(String sentenceText) { this.sentenceText = sentenceText; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
    public String getBlanksJson() { return blanksJson; }
    public void setBlanksJson(String blanksJson) { this.blanksJson = blanksJson; }
}
```

- [ ] **Step 5: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/entity/Lesson.java \
  backend/src/main/java/com/listeningtrainer/entity/LessonSentence.java \
  backend/src/main/java/com/listeningtrainer/entity/PracticeRecord.java \
  backend/src/main/java/com/listeningtrainer/entity/PracticeAnswer.java
git commit -m "feat: add new entity classes for lesson-based architecture"
```

---

### Task 3: Backend Mappers

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/mapper/LessonMapper.java`
- Create: `backend/src/main/java/com/listeningtrainer/mapper/LessonSentenceMapper.java`
- Create: `backend/src/main/java/com/listeningtrainer/mapper/PracticeRecordMapper.java`
- Create: `backend/src/main/java/com/listeningtrainer/mapper/PracticeAnswerMapper.java`

- [ ] **Step 1: Create all 4 mapper interfaces**

Follow existing mapper pattern (simple MyBatis-Plus BaseMapper):

`LessonMapper.java`:
```java
package com.listeningtrainer.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.listeningtrainer.entity.Lesson;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LessonMapper extends BaseMapper<Lesson> {
}
```

`LessonSentenceMapper.java`:
```java
package com.listeningtrainer.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.listeningtrainer.entity.LessonSentence;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface LessonSentenceMapper extends BaseMapper<LessonSentence> {
}
```

`PracticeRecordMapper.java`:
```java
package com.listeningtrainer.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.listeningtrainer.entity.PracticeRecord;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PracticeRecordMapper extends BaseMapper<PracticeRecord> {
}
```

`PracticeAnswerMapper.java`:
```java
package com.listeningtrainer.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.listeningtrainer.entity.PracticeAnswer;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PracticeAnswerMapper extends BaseMapper<PracticeAnswer> {
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/mapper/LessonMapper.java \
  backend/src/main/java/com/listeningtrainer/mapper/LessonSentenceMapper.java \
  backend/src/main/java/com/listeningtrainer/mapper/PracticeRecordMapper.java \
  backend/src/main/java/com/listeningtrainer/mapper/PracticeAnswerMapper.java
git commit -m "feat: add MyBatis-Plus mappers for new entities"
```

---

## Phase 2: Backend — Sentence Splitting + Cloze Generation

### Task 4: SentenceSplitter Service (CoreNLP)

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/service/SentenceSplitter.java`

- [ ] **Step 1: Create SentenceSplitter.java**

This service uses Stanford CoreNLP to:
1. Split text into sentences
2. Tag POS for each word
3. Extract nouns (NN/NNS/NNP/NNPS) and verbs (VB/VBD/VBG/VBN/VBP/VBZ) as blanks

```java
package com.listeningtrainer.service;

import edu.stanford.nlp.ling.*;
import edu.stanford.nlp.pipeline.*;
import edu.stanford.nlp.util.*;
import com.fasterxml.jackson.databind.*;
import org.springframework.stereotype.*;

import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

@Service
public class SentenceSplitter {

    private static final Pipeline pipeline;
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize,ssplit,pos");
        props.setProperty("tokenize.language", "en");
        pipeline = new Pipeline(props);
    }

    /**
     * Split text into sentences and generate blanks for each.
     * Returns JSON array of sentence objects: [{text, blanksJson}, ...]
     * Each blanksJson is: [{word, position, length}]
     */
    public String splitAndTag(String text) {
        CoreDocument doc = pipeline.processToCoreDocument(text);

        List<Map<String, Object>> sentences = new ArrayList<>();
        int idx = 0;

        for (CoreLabel sentence : doc.sentences()) {
            String sentenceText = sentence.text().trim();
            if (sentenceText.isEmpty()) continue;

            List<CoreLabel> tokens = sentence.tokens();
            List<Map<String, Object>> blanks = new ArrayList<>();
            int position = 0;

            for (CoreLabel token : tokens) {
                String pos = token.tag();
                String word = token.word();
                String lemma = token.lemma();

                // Skip short words and function words
                if (word.length() <= 2) {
                    position += word.length() + 1; // +1 for space
                    continue;
                }

                // Nouns: NN, NNS, NNP, NNPS
                // Verbs: VB, VBD, VBG, VBN, VBP, VBZ
                boolean isNoun = pos.startsWith("NN");
                boolean isVerb = pos.startsWith("VB");

                if (isNoun || isVerb) {
                    Map<String, Object> blank = new LinkedHashMap<>();
                    blank.put("word", lemma);
                    blank.put("position", position);
                    blank.put("length", word.length());
                    blanks.add(blank);
                }

                position += word.length() + 1;
            }

            // Limit blanks to max 4 per sentence for playability
            if (blanks.size() > 4) {
                blanks = blanks.subList(0, 4);
            }

            Map<String, Object> sentenceObj = new LinkedHashMap<>();
            sentenceObj.put("index", idx);
            sentenceObj.put("text", sentenceText);
            sentenceObj.put("blanksJson", blanks);

            sentences.add(sentenceObj);
            idx++;
        }

        try {
            return mapper.writeValueAsString(sentences);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize sentences", e);
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/service/SentenceSplitter.java
git commit -m "feat: add CoreNLP sentence splitter with POS-based cloze generation"
```

---

## Phase 3: Backend — DTOs + Services + Controllers

### Task 5: DTOs

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/dto/LessonUploadRequest.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/LessonSentenceEdit.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/LessonResponse.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/LessonSentenceResponse.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/PracticeSubmitRequest.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/PracticeCompleteResponse.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/SentencePracticeInfo.java`
- Create: `backend/src/main/java/com/listeningtrainer/dto/ReviewDetailResponse.java`

- [ ] **Step 1: LessonUploadRequest.java**

```java
package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;

public class LessonUploadRequest {

    @NotBlank private String title;
    @NotBlank private String difficulty;
    private String hint;
    @NotBlank private String text;
    private String voice;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
}
```

- [ ] **Step 2: LessonSentenceEdit.java**

```java
package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;
import java.util.*;

public class LessonSentenceEdit {

    @NotNull private Integer index;
    @NotBlank private String text;
    private List<Map<String, Object>> blanksJson;

    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public List<Map<String, Object>> getBlanksJson() { return blanksJson; }
    public void setBlanksJson(List<Map<String, Object>> blanksJson) { this.blanksJson = blanksJson; }
}
```

- [ ] **Step 3: LessonResponse.java**

```java
package com.listeningtrainer.dto;

import java.time.LocalDateTime;
import java.util.*;

public class LessonResponse {

    private Long id;
    private String title;
    private String difficulty;
    private String hint;
    private String status;
    private LocalDateTime createdAt;
    private List<LessonSentenceResponse> sentences;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<LessonSentenceResponse> getSentences() { return sentences; }
    public void setSentences(List<LessonSentenceResponse> sentences) { this.sentences = sentences; }
}
```

- [ ] **Step 4: LessonSentenceResponse.java**

```java
package com.listeningtrainer.dto;

import java.util.*;

public class LessonSentenceResponse {

    private Long id;
    private Integer index;
    private String text;
    private String audioPath;
    private String voice;
    private List<Map<String, Object>> blanks;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public String getVoice() { return voice; }
    public void setVoice(String voice) { this.voice = voice; }
    public List<Map<String, Object>> getBlanks() { return blanks; }
    public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
}
```

- [ ] **Step 5: SentencePracticeInfo.java**

```java
package com.listeningtrainer.dto;

import java.util.*;

public class SentencePracticeInfo {

    private Long sentenceId;
    private Integer index;
    private Integer totalSentences;
    private String audioPath;
    private List<Map<String, Object>> blanks;

    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public Integer getIndex() { return index; }
    public void setIndex(Integer index) { this.index = index; }
    public Integer getTotalSentences() { return totalSentences; }
    public void setTotalSentences(Integer totalSentences) { this.totalSentences = totalSentences; }
    public String getAudioPath() { return audioPath; }
    public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
    public List<Map<String, Object>> getBlanks() { return blanks; }
    public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
}
```

- [ ] **Step 6: PracticeSubmitRequest.java**

```java
package com.listeningtrainer.dto;

import jakarta.validation.constraints.*;
import java.util.*;

public class PracticeSubmitRequest {

    @NotNull private Long sentenceId;
    @NotBlank private String userAnswer;

    public Long getSentenceId() { return sentenceId; }
    public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
}
```

- [ ] **Step 7: PracticeCompleteResponse.java**

```java
package com.listeningtrainer.dto;

public class PracticeCompleteResponse {

    private Long recordId;
    private int score;

    public PracticeCompleteResponse(Long recordId, int score) {
        this.recordId = recordId;
        this.score = score;
    }

    public Long getRecordId() { return recordId; }
    public int getScore() { return score; }
}
```

- [ ] **Step 8: ReviewDetailResponse.java**

```java
package com.listeningtrainer.dto;

import java.time.LocalDateTime;
import java.util.*;

public class ReviewDetailResponse {

    private Long recordId;
    private Long lessonId;
    private String lessonTitle;
    private int score;
    private int listenCount;
    private LocalDateTime completedAt;
    private List<ReviewSentenceDetail> sentences;

    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getListenCount() { return listenCount; }
    public void setListenCount(int listenCount) { this.listenCount = listenCount; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public List<ReviewSentenceDetail> getSentences() { return sentences; }
    public void setSentences(List<ReviewSentenceDetail> sentences) { this.sentences = sentences; }

    public static class ReviewSentenceDetail {
        private Long sentenceId;
        private String sentenceText;
        private String audioPath;
        private String userAnswer;
        private List<Map<String, Object>> blanks;

        public Long getSentenceId() { return sentenceId; }
        public void setSentenceId(Long sentenceId) { this.sentenceId = sentenceId; }
        public String getSentenceText() { return sentenceText; }
        public void setSentenceText(String sentenceText) { this.sentenceText = sentenceText; }
        public String getAudioPath() { return audioPath; }
        public void setAudioPath(String audioPath) { this.audioPath = audioPath; }
        public String getUserAnswer() { return userAnswer; }
        public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
        public List<Map<String, Object>> getBlanks() { return blanks; }
        public void setBlanks(List<Map<String, Object>> blanks) { this.blanks = blanks; }
    }
}
```

- [ ] **Step 9: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/dto/
git commit -m "feat: add DTOs for lesson management and practice"
```

---

### Task 6: LessonService

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/service/LessonService.java`

- [ ] **Step 1: Create LessonService.java**

This service handles:
1. Upload text → split sentences → generate blanks → return draft lesson
2. Edit sentences (user校对)
3. Generate TTS audio for each sentence → save MP3 files → update status

```java
package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.*;
import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.*;
import com.listeningtrainer.mapper.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.stereotype.*;

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

@Service
public class LessonService {

    private static final String BAIDU_TTS_URL = "https://fanyi.baidu.com/gettts";
    private static final String AUDIO_DIR = "public/audio/lessons";

    private final LessonMapper lessonMapper;
    private final LessonSentenceMapper sentenceMapper;
    private final SentenceSplitter sentenceSplitter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LessonService(LessonMapper lessonMapper,
                         LessonSentenceMapper sentenceMapper,
                         SentenceSplitter sentenceSplitter) {
        this.lessonMapper = lessonMapper;
        this.sentenceMapper = sentenceMapper;
        this.sentenceSplitter = sentenceSplitter;
    }

    /**
     * Upload text, split sentences, generate blanks.
     * Returns lesson in "drafting" status.
     */
    public LessonResponse createDraft(Long userId, LessonUploadRequest request) {
        Lesson lesson = new Lesson();
        lesson.setUserId(userId);
        lesson.setTitle(request.getTitle());
        lesson.setDifficulty(request.getDifficulty());
        lesson.setHint(request.getHint());
        lesson.setStatus("drafting");
        lessonMapper.insert(lesson);

        String sentencesJson = sentenceSplitter.splitAndTag(request.getText());

        try {
            List<Map<String, Object>> sentences = objectMapper.readValue(sentencesJson, List.class);
            String voice = request.getVoice() != null ? request.getVoice() : "male";

            for (Map<String, Object> s : sentences) {
                LessonSentence ls = new LessonSentence();
                ls.setLessonId(lesson.getId());
                ls.setSentenceIndex((Integer) s.get("index"));
                ls.setText((String) s.get("text"));
                ls.setVoice(voice);
                ls.setBlanksJson(objectMapper.writeValueAsString(s.get("blanksJson")));
                sentenceMapper.insert(ls);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse sentences", e);
        }

        return getLessonById(lesson.getId(), userId);
    }

    /**
     * Update sentences after user review/edit.
     */
    public LessonResponse updateSentences(Long userId, Long lessonId, List<LessonSentenceEdit> edits) {
        // Verify ownership
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        // Delete existing sentences
        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId);
        sentenceMapper.delete(wrapper);

        // Insert edited sentences
        for (LessonSentenceEdit edit : edits) {
            LessonSentence ls = new LessonSentence();
            ls.setLessonId(lessonId);
            ls.setSentenceIndex(edit.getIndex());
            ls.setText(edit.getText());
            ls.setVoice(lesson.getDifficulty().equals("academic") ? "female" : "male");
            try {
                ls.setBlanksJson(objectMapper.writeValueAsString(edit.getBlanksJson()));
            } catch (Exception e) {
                ls.setBlanksJson("[]");
            }
            sentenceMapper.insert(ls);
        }

        return getLessonById(lessonId, userId);
    }

    /**
     * Generate TTS audio for all sentences.
     * Updates status to "ready" on success, "failed" on error.
     */
    public LessonResponse generateAudio(Long userId, Long lessonId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            throw new RuntimeException("Lesson not found");
        }

        lesson.setStatus("generating");
        lessonMapper.updateById(lesson);

        try {
            LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(LessonSentence::getLessonId, lessonId)
                   .orderByAsc(LessonSentence::getSentenceIndex);
            List<LessonSentence> sentences = sentenceMapper.selectList(wrapper);

            Path audioDir = Paths.get(AUDIO_DIR, String.valueOf(lessonId));
            Files.createDirectories(audioDir);

            for (LessonSentence ls : sentences) {
                String audioPath = generateTtsAudio(ls.getText(), audioDir, ls.getSentenceIndex());
                ls.setAudioPath(audioPath);
                sentenceMapper.updateById(ls);
            }

            lesson.setStatus("ready");
            lessonMapper.updateById(lesson);
        } catch (Exception e) {
            lesson.setStatus("failed");
            lessonMapper.updateById(lesson);
        }

        return getLessonById(lessonId, userId);
    }

    private String generateTtsAudio(String text, Path audioDir, int index) throws Exception {
        String encoded = URLEncoder.encode(text, java.nio.charset.StandardCharsets.UTF_8);
        String urlStr = BAIDU_TTS_URL + "?lan=en&text=" + encoded + "&spd=3";

        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(15000);
        conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        conn.connect();

        if (conn.getResponseCode() != 200) {
            conn.disconnect();
            throw new RuntimeException("TTS request failed");
        }

        Path outputPath = audioDir.resolve(index + ".mp3");
        try (InputStream is = conn.getInputStream()) {
            Files.copy(is, outputPath, StandardCopyOption.REPLACE_EXISTING);
        }

        conn.disconnect();
        return "/audio/lessons/" + audioDir.getFileName() + "/" + index + ".mp3";
    }

    /**
     * Get lesson list for user.
     */
    public List<LessonResponse> getLessons(Long userId) {
        LambdaQueryWrapper<Lesson> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Lesson::getUserId, userId)
               .orderByDesc(Lesson::getCreatedAt);
        return lessonMapper.selectList(wrapper).stream()
                .map(l -> toLessonResponse(l, Collections.emptyList()))
                .toList();
    }

    /**
     * Get single lesson with sentences.
     */
    public LessonResponse getLessonById(Long lessonId, Long userId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) {
            return null;
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId)
               .orderByAsc(LessonSentence::getSentenceIndex);
        List<LessonSentence> sentences = sentenceMapper.selectList(wrapper);

        return toLessonResponse(lesson, sentences);
    }

    public void deleteLesson(Long userId, Long lessonId) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId)) return;

        // Delete sentences
        LambdaQueryWrapper<LessonSentence> sw = new LambdaQueryWrapper<>();
        sw.eq(LessonSentence::getLessonId, lessonId);
        sentenceMapper.delete(sw);

        lessonMapper.deleteById(lessonId);

        // Delete audio files
        try {
            Path audioDir = Paths.get(AUDIO_DIR, String.valueOf(lessonId));
            if (Files.exists(audioDir)) {
                Files.walk(audioDir)
                     .sorted(Comparator.reverseOrder())
                     .forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
            }
        } catch (IOException ignored) {}
    }

    private LessonResponse toLessonResponse(Lesson lesson, List<LessonSentence> sentences) {
        LessonResponse resp = new LessonResponse();
        resp.setId(lesson.getId());
        resp.setTitle(lesson.getTitle());
        resp.setDifficulty(lesson.getDifficulty());
        resp.setHint(lesson.getHint());
        resp.setStatus(lesson.getStatus());
        resp.setCreatedAt(lesson.getCreatedAt());

        List<LessonSentenceResponse> sentenceResponses = new ArrayList<>();
        for (LessonSentence ls : sentences) {
            LessonSentenceResponse sr = new LessonSentenceResponse();
            sr.setId(ls.getId());
            sr.setIndex(ls.getSentenceIndex());
            sr.setText(ls.getText());
            sr.setAudioPath(ls.getAudioPath());
            sr.setVoice(ls.getVoice());
            try {
                sr.setBlanks(objectMapper.readValue(ls.getBlanksJson(), List.class));
            } catch (Exception e) {
                sr.setBlanks(Collections.emptyList());
            }
            sentenceResponses.add(sr);
        }
        resp.setSentences(sentenceResponses);
        return resp;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/service/LessonService.java
git commit -m "feat: add LessonService with upload, edit, TTS generation"
```

---

### Task 7: PracticeService

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/service/PracticeService.java`

- [ ] **Step 1: Create PracticeService.java**

```java
package com.listeningtrainer.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.*;
import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.*;
import com.listeningtrainer.mapper.*;
import org.springframework.stereotype.*;

import java.util.*;
import java.util.stream.*;

@Service
public class PracticeService {

    private final LessonMapper lessonMapper;
    private final LessonSentenceMapper sentenceMapper;
    private final PracticeRecordMapper recordMapper;
    private final PracticeAnswerMapper answerMapper;
    private final UserProgressSummaryMapper summaryMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PracticeService(LessonMapper lessonMapper,
                           LessonSentenceMapper sentenceMapper,
                           PracticeRecordMapper recordMapper,
                           PracticeAnswerMapper answerMapper,
                           UserProgressSummaryMapper summaryMapper) {
        this.lessonMapper = lessonMapper;
        this.sentenceMapper = sentenceMapper;
        this.recordMapper = recordMapper;
        this.answerMapper = answerMapper;
        this.summaryMapper = summaryMapper;
    }

    /**
     * Get sentence info for practice (audio path + blanks).
     */
    public SentencePracticeInfo getSentenceInfo(Long userId, Long lessonId, int sentenceIdx) {
        Lesson lesson = lessonMapper.selectById(lessonId);
        if (lesson == null || !lesson.getUserId().equals(userId) || !"ready".equals(lesson.getStatus())) {
            return null;
        }

        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getLessonId, lessonId)
               .eq(LessonSentence::getSentenceIndex, sentenceIdx);
        LessonSentence ls = sentenceMapper.selectOne(wrapper);
        if (ls == null) return null;

        // Get total sentence count
        LambdaQueryWrapper<LessonSentence> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(LessonSentence::getLessonId, lessonId);
        int total = sentenceMapper.selectCount(countWrapper).intValue();

        SentencePracticeInfo info = new SentencePracticeInfo();
        info.setSentenceId(ls.getId());
        info.setIndex(ls.getSentenceIndex());
        info.setTotalSentences(total);
        info.setAudioPath(ls.getAudioPath());
        try {
            info.setBlanks(objectMapper.readValue(ls.getBlanksJson(), List.class));
        } catch (Exception e) {
            info.setBlanks(Collections.emptyList());
        }
        return info;
    }

    /**
     * Submit answer for a sentence. Returns per-sentence score.
     */
    public Map<String, Object> submitSentenceAnswer(Long sentenceId, String userAnswer) {
        LambdaQueryWrapper<LessonSentence> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LessonSentence::getId, sentenceId);
        LessonSentence ls = sentenceMapper.selectOne(wrapper);
        if (ls == null) return Collections.emptyMap();

        List<Map<String, Object>> blanks;
        try {
            blanks = objectMapper.readValue(ls.getBlanksJson(), List.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }

        String[] userWords = userAnswer.trim().split("\\s+");
        List<Map<String, Object>> results = new ArrayList<>();
        int correct = 0;

        for (Map<String, Object> blank : blanks) {
            String expectedWord = (String) blank.get("word");
            // Find matching user word by position or sequential matching
            String userWord = "";
            if (results.size() < userWords.length) {
                userWord = userWords[results.size()];
            }

            boolean isCorrect = userWord.equalsIgnoreCase(expectedWord);
            if (isCorrect) correct++;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("word", expectedWord);
            result.put("correct", isCorrect);
            result.put("userAnswer", userWord);
            results.add(result);
        }

        int sentenceScore = blanks.isEmpty() ? 100 : (int) Math.round((double) correct / blanks.size() * 100);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sentenceId", sentenceId);
        response.put("score", sentenceScore);
        response.put("blanks", results);
        return response;
    }

    /**
     * Complete practice session, save all answers and calculate total score.
     */
    public PracticeCompleteResponse completePractice(Long userId, Long lessonId,
                                                      List<Map<String, Object>> allAnswers) {
        // Create practice record
        PracticeRecord record = new PracticeRecord();
        record.setLessonId(lessonId);
        record.setUserId(userId);
        record.setListenCount(0);
        recordMapper.insert(record);

        int totalScore = 0;
        int sentenceCount = 0;

        // Save each answer
        for (Map<String, Object> answerData : allAnswers) {
            PracticeAnswer pa = new PracticeAnswer();
            pa.setRecordId(record.getId());
            pa.setSentenceId(((Number) answerData.get("sentenceId")).longValue());
            pa.setSentenceText((String) answerData.get("sentenceText"));
            pa.setUserAnswer((String) answerData.get("userAnswer"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> blanks = (List<Map<String, Object>>) answerData.get("blanks");
            try {
                pa.setBlanksJson(objectMapper.writeValueAsString(blanks));
            } catch (Exception e) {
                pa.setBlanksJson("[]");
            }

            int s = (int) answerData.get("score");
            totalScore += s;
            sentenceCount++;

            answerMapper.insert(pa);
        }

        int avgScore = sentenceCount > 0 ? totalScore / sentenceCount : 0;
        record.setScore(avgScore);
        recordMapper.updateById(record);

        // Update user_progress summary
        LambdaQueryWrapper<UserProgressSummary> sw = new LambdaQueryWrapper<>();
        sw.eq(UserProgressSummary::getUserId, userId)
          .eq(UserProgressSummary::getLessonId, String.valueOf(lessonId));
        UserProgressSummary summary = summaryMapper.selectOne(sw);
        if (summary == null) {
            summary = new UserProgressSummary();
            summary.setUserId(userId);
            summary.setLessonId(String.valueOf(lessonId));
            summary.setLatestScore(avgScore);
            summary.setBestScore(avgScore);
            summary.setTotalAttempts(1);
            summary.setLastDate(java.time.LocalDate.now());
            summaryMapper.insert(summary);
        } else {
            summary.setLatestScore(avgScore);
            summary.setBestScore(Math.max(summary.getBestScore(), avgScore));
            summary.setTotalAttempts(summary.getTotalAttempts() + 1);
            summary.setLastDate(java.time.LocalDate.now());
            summaryMapper.updateById(summary);
        }

        return new PracticeCompleteResponse(record.getId(), avgScore);
    }

    /**
     * Get review detail with original text + user answers.
     */
    public ReviewDetailResponse getReviewDetail(Long userId, Long recordId) {
        PracticeRecord record = recordMapper.selectById(recordId);
        if (record == null || !record.getUserId().equals(userId)) return null;

        Lesson lesson = lessonMapper.selectById(record.getLessonId());
        if (lesson == null) return null;

        ReviewDetailResponse resp = new ReviewDetailResponse();
        resp.setRecordId(record.getId());
        resp.setLessonId(lesson.getId());
        resp.setLessonTitle(lesson.getTitle());
        resp.setScore(record.getScore());
        resp.setListenCount(record.getListenCount());
        resp.setCompletedAt(record.getCompletedAt());

        // Get all answers for this record
        LambdaQueryWrapper<PracticeAnswer> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PracticeAnswer::getRecordId, recordId);
        List<PracticeAnswer> answers = answerMapper.selectList(wrapper);

        List<ReviewDetailResponse.ReviewSentenceDetail> sentenceDetails = new ArrayList<>();
        for (PracticeAnswer pa : answers) {
            ReviewDetailResponse.ReviewSentenceDetail detail = new ReviewDetailResponse.ReviewSentenceDetail();
            detail.setSentenceId(pa.getSentenceId());
            detail.setSentenceText(pa.getSentenceText());
            detail.setUserAnswer(pa.getUserAnswer());

            // Get audio path from lesson_sentence
            LambdaQueryWrapper<LessonSentence> sw = new LambdaQueryWrapper<>();
            sw.eq(LessonSentence::getId, pa.getSentenceId());
            LessonSentence ls = sentenceMapper.selectOne(sw);
            if (ls != null) detail.setAudioPath(ls.getAudioPath());

            try {
                detail.setBlanks(objectMapper.readValue(pa.getBlanksJson(), List.class));
            } catch (Exception e) {
                detail.setBlanks(Collections.emptyList());
            }
            sentenceDetails.add(detail);
        }
        resp.setSentences(sentenceDetails);
        return resp;
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/service/PracticeService.java
git commit -m "feat: add PracticeService for sentence-by-sentence practice and review"
```

---

### Task 8: LessonController

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/controller/LessonController.java`

- [ ] **Step 1: Create LessonController.java**

```java
package com.listeningtrainer.controller;

import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.LessonService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping
    public ResponseEntity<LessonResponse> createLesson(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LessonUploadRequest request) {
        return ResponseEntity.ok(lessonService.createDraft(user.getId(), request));
    }

    @PutMapping("/{id}/sentences")
    public ResponseEntity<LessonResponse> updateSentences(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody List<LessonSentenceEdit> edits) {
        return ResponseEntity.ok(lessonService.updateSentences(user.getId(), id, edits));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<LessonResponse> generateAudio(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(lessonService.generateAudio(user.getId(), id));
    }

    @GetMapping
    public ResponseEntity<List<LessonResponse>> getLessons(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(lessonService.getLessons(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LessonResponse> getLesson(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        LessonResponse lesson = lessonService.getLessonById(id, user.getId());
        if (lesson == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(lesson);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        lessonService.deleteLesson(user.getId(), id);
        return ResponseEntity.ok().build();
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/controller/LessonController.java
git commit -m "feat: add LessonController for lesson CRUD and TTS generation"
```

---

### Task 9: PracticeController

**Files:**
- Create: `backend/src/main/java/com/listeningtrainer/controller/PracticeController.java`

- [ ] **Step 1: Create PracticeController.java**

```java
package com.listeningtrainer.controller;

import com.listeningtrainer.dto.*;
import com.listeningtrainer.entity.User;
import com.listeningtrainer.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lessons/{lessonId}/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @GetMapping
    public ResponseEntity<SentencePracticeInfo> getSentence(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @RequestParam(defaultValue = "0") int sentenceIdx) {
        SentencePracticeInfo info = practiceService.getSentenceInfo(user.getId(), lessonId, sentenceIdx);
        if (info == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(info);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @Valid @RequestBody PracticeSubmitRequest request) {
        return ResponseEntity.ok(practiceService.submitSentenceAnswer(
                request.getSentenceId(), request.getUserAnswer()));
    }

    @PostMapping("/complete")
    public ResponseEntity<PracticeCompleteResponse> complete(
            @AuthenticationPrincipal User user,
            @PathVariable Long lessonId,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> answers =
            (java.util.List<Map<String, Object>>) body.get("answers");
        PracticeCompleteResponse resp = practiceService.completePractice(
                user.getId(), lessonId, answers);
        return ResponseEntity.ok(resp);
    }
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/controller/PracticeController.java
git commit -m "feat: add PracticeController for sentence-by-sentence practice API"
```

---

### Task 10: Update ProgressService.getProgressDetail for Review

**Files:**
- Modify: `backend/src/main/java/com/listeningtrainer/service/ProgressService.java`
- Modify: `backend/src/main/java/com/listeningtrainer/controller/ProgressController.java`

- [ ] **Step 1: Modify ProgressService.getProgressDetail**

Add a new method to ProgressService that returns `ReviewDetailResponse` using `PracticeService`:

In `ProgressService.java`, add dependency injection for `PracticeService`:

```java
// Add field
private final PracticeService practiceService;

// Update constructor
public ProgressService(UserProgressMapper progressMapper,
                       UserProgressSummaryMapper summaryMapper,
                       PracticeDetailMapper detailMapper,
                       PracticeService practiceService) {
    this.progressMapper = progressMapper;
    this.summaryMapper = summaryMapper;
    this.detailMapper = detailMapper;
    this.practiceService = practiceService;
}

// Add method
public ReviewDetailResponse getReviewDetail(Long userId, Long recordId) {
    return practiceService.getReviewDetail(userId, recordId);
}
```

- [ ] **Step 2: Modify ProgressController**

In `ProgressController.java`, update `getProgressDetail`:

```java
@GetMapping("/detail/{progressId}")
public ResponseEntity<?> getProgressDetail(@AuthenticationPrincipal User user,
                                           @PathVariable Long progressId) {
    // Try new review API first
    ReviewDetailResponse detail = progressService.getReviewDetail(user.getId(), progressId);
    if (detail != null) {
        return ResponseEntity.ok(detail);
    }
    // Fallback to old PracticeDetailResponse for backwards compat
    PracticeDetailResponse oldDetail = progressService.getProgressDetail(user.getId(), progressId);
    if (oldDetail == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(oldDetail);
}
```

Also add `ReviewDetailResponse` to imports.

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/java/com/listeningtrainer/service/ProgressService.java \
  backend/src/main/java/com/listeningtrainer/controller/ProgressController.java
git commit -m "feat: update progress detail to return new review format"
```

---

### Task 11: Run DB Migration

**Files:**
- Modify: `backend/src/main/resources/application.properties` (if needed for H2 dev schema)

- [ ] **Step 1: Update H2 dev schema**

If using H2 for development, add the new table DDL to `application-h2.properties` or ensure `schema.sql` is loaded on startup.

The project already uses `schema.sql` — verify Spring is configured to run it on startup:

Check `application.properties`:

```properties
# Should already have:
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
```

If not present, add them.

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add backend/src/main/resources/application.properties
git commit -m "chore: ensure schema.sql runs on H2 startup"
```

---

## Phase 4: Frontend — Types + API Layer

### Task 12: Frontend Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Rewrite types/index.ts**

```typescript
export type Difficulty = 'daily' | 'campus' | 'academic';
export type LessonStatus = 'drafting' | 'generating' | 'ready' | 'failed';

export interface ClozeBlank {
  word: string;
  position: number;
  length: number;
}

export interface LessonSentence {
  id: number;
  index: number;
  text: string;
  audioPath: string;
  voice: 'male' | 'female';
  blanks: ClozeBlank[];
}

export interface Lesson {
  id: number;
  title: string;
  difficulty: Difficulty;
  hint: string;
  status: LessonStatus;
  sentences: LessonSentence[];
}

export interface LessonProgress {
  score: number;
  date: string;
  attempts: number;
  bestScore: number;
}

export interface ProgressMap {
  [lessonId: string]: LessonProgress;
}

export interface PracticeRecord {
  id: number;
  lessonId: number;
  lessonTitle: string;
  score: number;
  listenCount: number;
  completedAt: string;
}

export interface ReviewSentenceDetail {
  sentenceId: number;
  sentenceText: string;
  audioPath: string;
  userAnswer: string;
  blanks: { word: string; correct: boolean; userAnswer: string }[];
}

export interface ReviewDetail {
  recordId: number;
  lessonId: number;
  lessonTitle: string;
  score: number;
  listenCount: number;
  completedAt: string;
  sentences: ReviewSentenceDetail[];
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/types/index.ts
git commit -m "feat: update frontend types for sentence-based lessons"
```

---

### Task 13: Frontend API Layer

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add new API functions to api.ts**

Append to the existing `src/lib/api.ts`:

```typescript
// ===== Lesson Management API =====

export async function apiCreateLesson(data: {
  title: string;
  difficulty: string;
  hint?: string;
  text: string;
  voice?: string;
}): Promise<Lesson> {
  return request<Lesson>('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateLessonSentences(
  lessonId: number,
  sentences: { index: number; text: string; blanksJson: any[] }[]
): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}/sentences`, {
    method: 'PUT',
    body: JSON.stringify(sentences),
  });
}

export async function apiGenerateAudio(lessonId: number): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}/generate`, {
    method: 'POST',
  });
}

export async function apiGetLessons(): Promise<Lesson[]> {
  return request<Lesson[]>('/api/lessons');
}

export async function apiGetLesson(lessonId: number): Promise<Lesson> {
  return request<Lesson>(`/api/lessons/${lessonId}`);
}

export async function apiDeleteLesson(lessonId: number): Promise<void> {
  return request<void>(`/api/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

// ===== Practice API =====

export interface SentencePracticeInfo {
  sentenceId: number;
  index: number;
  totalSentences: number;
  audioPath: string;
  blanks: { word: string; position: number; length: number }[];
}

export async function apiGetSentence(lessonId: number, sentenceIdx: number): Promise<SentencePracticeInfo> {
  return request<SentencePracticeInfo>(`/api/lessons/${lessonId}/practice?sentenceIdx=${sentenceIdx}`);
}

export async function apiSubmitSentenceAnswer(
  lessonId: number,
  data: { sentenceId: number; userAnswer: string }
): Promise<{ sentenceId: number; score: number; blanks: { word: string; correct: boolean; userAnswer: string }[] }> {
  return request(`/api/lessons/${lessonId}/practice/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiCompletePractice(
  lessonId: number,
  answers: { sentenceId: number; sentenceText: string; userAnswer: string; score: number; blanks: any[] }[]
): Promise<{ recordId: number; score: number }> {
  return request(`/api/lessons/${lessonId}/practice/complete`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ===== Review API =====

export async function apiGetReviewDetail(recordId: number): Promise<ReviewDetail> {
  return request<ReviewDetail>(`/api/progress/detail/${recordId}`);
}
```

Also update the existing `LessonData` interface in the Lessons API section to use the new `Lesson` type from `types/index.ts`, or remove it since it's superseded.

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/lib/api.ts
git commit -m "feat: add lesson management, practice, and review API functions"
```

---

## Phase 5: Frontend — Components

### Task 14: StatusBadge Component

**Files:**
- Create: `src/components/StatusBadge.tsx`

- [ ] **Step 1: Create StatusBadge.tsx**

```typescript
import type { LessonStatus } from '../types';

const statusConfig: Record<LessonStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  drafting: { label: 'Draft', color: 'text-text-secondary', bg: 'bg-bg-alt' },
  generating: { label: 'Generating', color: 'text-warning', bg: 'bg-warning/10', pulse: true },
  ready: { label: 'Ready', color: 'text-success', bg: 'bg-success/10' },
  failed: { label: 'Failed', color: 'text-error', bg: 'bg-error/10' },
};

export default function StatusBadge({ status }: { status: LessonStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}>
      {config.pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/components/StatusBadge.tsx
git commit -m "feat: add StatusBadge component for lesson generation status"
```

---

### Task 15: SentenceEditor Component

**Files:**
- Create: `src/components/SentenceEditor.tsx`

- [ ] **Step 1: Create SentenceEditor.tsx**

```typescript
import { useState } from 'react';
import type { LessonSentence } from '../types';

interface SentenceEditorProps {
  sentences: LessonSentence[];
  onChange: (sentences: { index: number; text: string; blanksJson: any[] }[]) => void;
}

export default function SentenceEditor({ sentences, onChange }: SentenceEditorProps) {
  const [edited, setEdited] = useState(sentences.map(s => ({ ...s })));

  function updateText(idx: number, text: string) {
    setEdited(prev => prev.map((s, i) => i === idx ? { ...s, text } : s));
  }

  function removeSentence(idx: number) {
    setEdited(prev => prev.filter((_, i) => i !== idx));
  }

  function mergeWithNext(idx: number) {
    if (idx >= edited.length - 1) return;
    setEdited(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text: next[idx].text + ' ' + next[idx + 1].text };
      next.splice(idx + 1, 1);
      return next;
    });
  }

  function handleSave() {
    onChange(
      edited.map((s, i) => ({
        index: i,
        text: s.text,
        blanksJson: s.blanks,
      }))
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">Review & Edit Sentences</h3>
      <p className="text-xs text-text-secondary">
        Edit sentences, merge short ones, or remove unnecessary ones.
      </p>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {edited.map((s, idx) => (
          <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3">
            <span className="mt-1 shrink-0 text-xs font-bold text-text-tertiary w-6">{idx + 1}.</span>
            <textarea
              value={s.text}
              onChange={(e) => updateText(idx, e.target.value)}
              rows={2}
              className="flex-1 resize-none rounded-md border border-border bg-bg p-2 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
            <div className="flex flex-col gap-1 shrink-0">
              {idx < edited.length - 1 && (
                <button
                  onClick={() => mergeWithNext(idx)}
                  className="rounded px-2 py-1 text-[10px] font-medium text-text-secondary hover:text-primary border border-border"
                  title="Merge with next sentence"
                >
                  Merge ↓
                </button>
              )}
              <button
                onClick={() => removeSentence(idx)}
                className="rounded px-2 py-1 text-[10px] font-medium text-error hover:bg-error/10 border border-error/20"
                title="Remove sentence"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-text-secondary">
        {edited.length} sentences detected. {edited.filter(s => s.blanks.length === 0).length} have no blanks.
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover transition-all"
      >
        Save & Generate Audio
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/components/SentenceEditor.tsx
git commit -m "feat: add SentenceEditor component for sentence review/edit"
```

---

### Task 16: ClozeRenderer Component

**Files:**
- Create: `src/components/ClozeRenderer.tsx`

- [ ] **Step 1: Create ClozeRenderer.tsx**

This component renders a sentence with blanks replaced by `<input>` fields.

```typescript
import { useState, useRef, useEffect } from 'react';

interface ClozeBlank {
  word: string;
  position: number;
  length: number;
}

interface ClozeRendererProps {
  text: string;
  blanks: ClozeBlank[];
  onAnswersChange?: (answers: string[]) => void;
  readOnly?: boolean;
  answers?: string[];
  results?: { word: string; correct: boolean; userAnswer: string }[];
}

export default function ClozeRenderer({
  text,
  blanks,
  onAnswersChange,
  readOnly = false,
  answers = [],
  results,
}: ClozeRendererProps) {
  const [inputs, setInputs] = useState<string[]>(blanks.map(() => ''));
  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (!readOnly && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [readOnly]);

  function handleChange(idx: number, value: string) {
    const next = [...inputs];
    next[idx] = value;
    setInputs(next);
    onAnswersChange?.(next);
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      const next = inputRefs.current[idx + 1];
      if (next) next.focus();
    }
  }

  // Build rendered text with blanks as inputs
  let offset = 0;
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < blanks.length; i++) {
    const blank = blanks[i];
    // Text before blank
    if (blank.position > offset) {
      parts.push(text.slice(offset, blank.position));
    }

    // Blank input or display
    if (readOnly && results && results[i]) {
      const r = results[i];
      const color = r.correct ? 'text-success' : 'text-error';
      const bg = r.correct ? 'bg-success/10' : 'bg-error/10';
      const border = r.correct ? 'border-success/30' : 'border-error/30';
      parts.push(
        <span key={i} className={`inline-block min-w-[60px] border-b-2 ${border} ${bg} ${color} px-1 text-center font-semibold`}>
          {r.userAnswer || '—'}
        </span>
      );
    } else if (readOnly) {
      parts.push(
        <span key={i} className="inline-block min-w-[60px] border-b-2 border-border px-1 text-center">
          {answers[i] || '—'}
        </span>
      );
    } else {
      parts.push(
        <input
          key={i}
          ref={el => { if (el) inputRefs.current[i] = el; }}
          type="text"
          value={inputs[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          placeholder={blank.word}
          className="inline-block min-w-[80px] rounded border-b-2 border-primary bg-primary/5 px-1 text-center text-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          style={{ width: `${Math.max(blank.word.length * 8 + 16, 60)}px` }}
        />
      );
    }

    offset = blank.position + blank.length;
  }

  // Remaining text after last blank
  if (offset < text.length) {
    parts.push(text.slice(offset));
  }

  return (
    <div className="text-sm leading-relaxed text-text break-words">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/components/ClozeRenderer.tsx
git commit -m "feat: add ClozeRenderer component for fill-in-the-blank display"
```

---

### Task 17: Review Panels (OriginalTextPanel + AnswerPanel)

**Files:**
- Create: `src/components/OriginalTextPanel.tsx`
- Create: `src/components/AnswerPanel.tsx`

- [ ] **Step 1: Create OriginalTextPanel.tsx**

```typescript
import type { ReviewSentenceDetail } from '../types';

interface OriginalTextPanelProps {
  sentences: ReviewSentenceDetail[];
  activeSentenceId: number | null;
  onSentenceClick: (sentenceId: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function OriginalTextPanel({
  sentences,
  activeSentenceId,
  onSentenceClick,
  audioRef,
}: OriginalTextPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Original Text
      </h3>
      <div className="space-y-1.5">
        {sentences.map((s) => (
          <button
            key={s.sentenceId}
            onClick={() => onSentenceClick(s.sentenceId)}
            className={`w-full text-left rounded-lg p-3 text-sm leading-relaxed transition-all ${
              activeSentenceId === s.sentenceId
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-surface text-text border border-transparent hover:border-border'
            }`}
          >
            {s.sentenceText}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AnswerPanel.tsx**

```typescript
import type { ReviewSentenceDetail } from '../types';
import ClozeRenderer from './ClozeRenderer';

interface AnswerPanelProps {
  sentences: ReviewSentenceDetail[];
  activeSentenceId: number | null;
  onSentenceClick: (sentenceId: number) => void;
}

export default function AnswerPanel({
  sentences,
  activeSentenceId,
  onSentenceClick,
}: AnswerPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        Your Answers
      </h3>
      <div className="space-y-1.5">
        {sentences.map((s) => {
          const hasError = s.blanks.some(b => !b.correct);
          return (
            <button
              key={s.sentenceId}
              onClick={() => onSentenceClick(s.sentenceId)}
              className={`w-full text-left rounded-lg p-3 transition-all ${
                activeSentenceId === s.sentenceId
                  ? 'bg-primary/10 border border-primary/30'
                  : hasError
                  ? 'bg-error/5 border border-error/20 hover:border-error/40'
                  : 'bg-surface border border-transparent hover:border-border'
              }`}
            >
              <ClozeRenderer
                text={s.sentenceText}
                blanks={s.blanks.map(b => ({ word: b.word, position: 0, length: b.word.length }))}
                readOnly
                results={s.blanks}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add src/components/OriginalTextPanel.tsx src/components/AnswerPanel.tsx
git commit -m "feat: add review panels (original text + answers with error highlighting)"
```

---

## Phase 6: Frontend — Pages + Routing

### Task 18: Update Router

**Files:**
- Modify: `src/lib/router.tsx`

- [ ] **Step 1: Add new routes**

Replace existing router with updated version:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RootLayout from '../routes/RootLayout';
import AuthPage from '../routes/AuthPage';
import HomePage from '../routes/HomePage';
import LessonsPage from '../routes/LessonsPage';
import LessonCreatePage from '../routes/LessonCreatePage';
import PlayerPage from '../routes/PlayerPage';
import HistoryPage from '../routes/HistoryPage';
import LessonHistoryPage from '../routes/LessonHistoryPage';
import HistoryDetailPage from '../routes/HistoryDetailPage';
import ReviewPage from '../routes/ReviewPage';
import SettingsPage from '../routes/SettingsPage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
          <div className="text-sm text-text-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'lessons',
          element: (
            <AuthGuard>
              <LessonsPage />
            </AuthGuard>
          ),
        },
        {
          path: 'lessons/new',
          element: (
            <AuthGuard>
              <LessonCreatePage />
            </AuthGuard>
          ),
        },
        {
          path: 'player/:lessonId',
          element: (
            <AuthGuard>
              <PlayerPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history',
          element: (
            <AuthGuard>
              <HistoryPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history/:lessonId',
          element: (
            <AuthGuard>
              <LessonHistoryPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history/detail/:id',
          element: (
            <AuthGuard>
              <HistoryDetailPage />
            </AuthGuard>
          ),
        },
        {
          path: 'history/:recordId/review',
          element: (
            <AuthGuard>
              <ReviewPage />
            </AuthGuard>
          ),
        },
        {
          path: 'settings',
          element: (
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          ),
        },
      ],
    },
    {
      path: '/auth',
      element: <AuthPage />,
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/lib/router.tsx
git commit -m "feat: add routes for lessons list, lesson creation, and review page"
```

---

### Task 19: LessonsPage (Course List)

**Files:**
- Modify: `src/routes/LessonsPage.tsx`

- [ ] **Step 1: Rewrite LessonsPage.tsx**

Replace the old difficulty-based list page with a new course list page.

```typescript
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';
import { apiGetLessons } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import Badge from './ui/Badge';
import Card from './ui/Card';

const tierTitles: Record<string, string> = {
  daily: 'Daily Life',
  campus: 'Campus Life',
  academic: 'Academic Lectures',
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetLessons()
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">My Lessons</h2>
        <button
          onClick={() => navigate('/lessons/new')}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
        >
          + New Lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-text-secondary">No lessons yet.</p>
          <button
            onClick={() => navigate('/lessons/new')}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white"
          >
            Create your first lesson
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-semibold text-primary">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text flex items-center gap-2">
                  {lesson.title}
                  <StatusBadge status={lesson.status} />
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant={lesson.difficulty === 'daily' ? 'success' : lesson.difficulty === 'campus' ? 'warning' : 'primary'}>
                    {tierTitles[lesson.difficulty]}
                  </Badge>
                  <span className="text-xs text-text-secondary">
                    {lesson.sentences?.length || 0} sentences
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {lesson.status === 'ready' && (
                  <button
                    onClick={() => navigate(`/player/${lesson.id}`)}
                    className="rounded-lg border border-border bg-bg-alt px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
                  >
                    Start
                  </button>
                )}
                {lesson.status === 'drafting' && (
                  <button
                    onClick={() => navigate(`/lessons/new?id=${lesson.id}`)}
                    className="rounded-lg border border-border bg-bg-alt px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-all"
                  >
                    Continue
                  </button>
                )}
                {lesson.status === 'failed' && (
                  <button
                    onClick={() => {/* retry generate */}}
                    className="rounded-lg border border-error/20 bg-error/5 px-4 py-2 text-xs font-semibold text-error hover:border-error/40 transition-all"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/routes/LessonsPage.tsx
git commit -m "feat: rewrite LessonsPage as course list with status badges"
```

---

### Task 20: LessonCreatePage

**Files:**
- Create: `src/routes/LessonCreatePage.tsx`

- [ ] **Step 1: Create LessonCreatePage.tsx**

This page handles both creating new lessons (upload text) and editing drafted lessons.

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Difficulty } from '../types';
import { apiCreateLesson, apiUpdateLessonSentences, apiGenerateAudio, apiGetLesson } from '../lib/api';
import SentenceEditor from '../components/SentenceEditor';
import StatusBadge from '../components/StatusBadge';
import Card from './ui/Card';

export default function LessonCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [step, setStep] = useState<'upload' | 'edit' | 'generating' | 'done'>('upload');

  // Upload form
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('daily');
  const [hint, setHint] = useState('');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'male' | 'female'>('male');

  // Edit state
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [sentences, setSentences] = useState<any[]>([]);

  useEffect(() => {
    if (editId) {
      apiGetLesson(Number(editId))
        .then(lesson => {
          setLessonId(lesson.id);
          setTitle(lesson.title);
          setDifficulty(lesson.difficulty);
          setHint(lesson.hint);
          setSentences(lesson.sentences);
          setStep('edit');
        })
        .catch(() => {});
    }
  }, [editId]);

  async function handleUpload() {
    if (!title.trim() || !text.trim()) return;

    try {
      const lesson = await apiCreateLesson({ title, difficulty, hint, text, voice });
      setLessonId(lesson.id);
      setSentences(lesson.sentences);
      setStep('edit');
    } catch (e) {
      alert('Failed to create lesson: ' + (e as Error).message);
    }
  }

  async function handleSaveSentences(edits: { index: number; text: string; blanksJson: any[] }[]) {
    if (!lessonId) return;

    try {
      setStep('generating');
      await apiUpdateLessonSentences(lessonId, edits);
      await apiGenerateAudio(lessonId);
      setStep('done');
    } catch (e) {
      alert('Failed to generate audio: ' + (e as Error).message);
      setStep('edit');
    }
  }

  if (step === 'upload') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          ← Back to Lessons
        </button>
        <h2 className="text-2xl font-bold text-text">Create New Lesson</h2>

        <Card className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Climate Change Overview"
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              <option value="daily">Daily Life</option>
              <option value="campus">Campus Life</option>
              <option value="academic">Academic Lectures</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Hint (optional)</label>
            <input
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="e.g., A lecture about climate change"
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Voice</label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value as 'male' | 'female')}
              className="w-full rounded-lg border border-border bg-bg p-3 text-sm text-text focus:border-primary/50 focus:outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here. It will be automatically split into sentences."
              rows={10}
              className="w-full resize-none rounded-lg border border-border bg-bg p-3 text-sm text-text placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!title.trim() || !text.trim()}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Split Sentences
          </button>
        </Card>
      </div>
    );
  }

  if (step === 'edit') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          ← Back to Lessons
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-text">{title}</h2>
          <StatusBadge status={editId ? 'drafting' : 'drafting'} />
        </div>

        <Card className="p-6">
          <SentenceEditor
            sentences={sentences}
            onChange={handleSaveSentences}
          />
        </Card>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in-up">
        <div className="h-12 w-12 rounded-full border-4 border-border border-t-primary animate-spin" />
        <div className="text-lg font-semibold text-text">Generating audio...</div>
        <div className="text-sm text-text-secondary">This may take a minute.</div>
      </div>
    );
  }

  // step === 'done'
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in-up">
      <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
        <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="text-lg font-semibold text-text">Lesson Ready!</div>
      <div className="text-sm text-text-secondary">Audio has been generated. You can start practicing.</div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-text hover:bg-bg-alt transition-all"
        >
          Back to Lessons
        </button>
        <button
          onClick={() => navigate(`/player/${lessonId}`)}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/routes/LessonCreatePage.tsx
git commit -m "feat: add LessonCreatePage with upload, edit, and TTS generation flow"
```

---

### Task 21: PlayerPage (Rewrite)

**Files:**
- Modify: `src/routes/PlayerPage.tsx`
- Modify: `src/components/Player.tsx` → 删除旧的，改为新的逐句填空组件

- [ ] **Step 1: Rewrite PlayerPage.tsx**

New PlayerPage handles sentence-by-sentence practice with audio + cloze inputs.

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Lesson, LessonSentence } from '../types';
import {
  apiGetLesson,
  apiSubmitSentenceAnswer,
  apiCompletePractice,
} from '../lib/api';
import ClozeRenderer from '../components/ClozeRenderer';
import Card from '../components/ui/Card';

export default function PlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showBlanks, setShowBlanks] = useState(false);
  const [results, setResults] = useState<Map<number, any[]>>(new Map());
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    apiGetLesson(Number(lessonId))
      .then(l => {
        setLesson(l);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const currentSentence = lesson?.sentences?.[currentIdx];

  const playAudio = useCallback((src: string) => {
    const a = audioRef.current;
    if (!a) return;
    a.src = src;
    a.load();
    a.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (currentSentence?.audioPath && !showBlanks) {
      setAudioReady(false);
      setTimeout(() => playAudio(currentSentence.audioPath), 300);
    }
  }, [currentIdx, currentSentence, showBlanks, playAudio]);

  function handleAudioEnd() {
    setShowBlanks(true);
    setIsPlaying(false);
  }

  function handleAnswersChange(sentenceIdx: number, vals: string[]) {
    setAnswers(prev => ({ ...prev, [sentenceIdx]: vals }));
  }

  async function handleNext() {
    if (!lesson || !currentSentence) return;

    const userAnswer = (answers[currentIdx] || []).join(' ');

    // Submit answer
    try {
      const result = await apiSubmitSentenceAnswer(Number(lessonId), {
        sentenceId: currentSentence.id,
        userAnswer,
      });
      setResults(prev => new Map(prev).set(currentIdx, result.blanks));
    } catch (e) {
      console.error('Failed to submit answer:', e);
    }

    if (currentIdx < (lesson.sentences?.length || 1) - 1) {
      setCurrentIdx(prev => prev + 1);
      setShowBlanks(false);
    } else {
      // Complete practice
      try {
        const allAnswers = lesson.sentences.map((s, i) => ({
          sentenceId: s.id,
          sentenceText: s.text,
          userAnswer: (answers[i] || []).join(' '),
          score: results.get(i)?.reduce((sum: number, b: any) => sum + (b.correct ? 1 : 0), 0) || 0,
          blanks: results.get(i) || [],
        }));
        const resp = await apiCompletePractice(Number(lessonId), allAnswers);
        setScore(resp.score);
      } catch (e) {
        console.error('Failed to complete practice:', e);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-xl border border-border bg-surface py-16 text-center">
        <p className="text-sm text-text-secondary">Lesson not found.</p>
        <button onClick={() => navigate('/lessons')} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          Go to Lessons
        </button>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Card className="p-8 text-center">
          <div className="text-5xl font-extrabold text-primary">{score}%</div>
          <div className="mt-2 text-lg text-text-secondary">Practice Complete!</div>
          <div className="mt-1 text-sm text-text-tertiary">
            {lesson.sentences.length} sentences practiced
          </div>
        </Card>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/lessons')}
            className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text hover:bg-bg-alt transition-all"
          >
            Back to Lessons
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-white hover:bg-success/90 transition-all"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  if (!currentSentence) return null;

  const isLast = currentIdx >= (lesson.sentences?.length || 1) - 1;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlay={() => setAudioReady(true)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/lessons')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text">{lesson.title}</h2>
          <div className="text-xs text-text-secondary">
            Sentence {currentIdx + 1} of {lesson.sentences.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIdx) / lesson.sentences.length) * 100}%` }}
        />
      </div>

      {/* Audio controls */}
      <Card className="flex items-center gap-4 px-5 py-3">
        <button
          onClick={() => {
            if (isPlaying) audioRef.current?.pause();
            else playAudio(currentSentence.audioPath);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
        >
          {isPlaying ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14.72a1 1 0 001.555.832l11.318-7.36a1 1 0 000-1.664L9.555 4.308A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>
        <span className="text-sm text-text-secondary">
          {isPlaying ? 'Playing...' : 'Click to replay'}
        </span>
      </Card>

      {/* Cloze area */}
      {showBlanks && currentSentence.blanks.length > 0 ? (
        <Card className="p-5">
          <div className="mb-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Fill in the blanks
          </div>
          <ClozeRenderer
            text={currentSentence.text}
            blanks={currentSentence.blanks}
            onAnswersChange={(vals) => handleAnswersChange(currentIdx, vals)}
          />
        </Card>
      ) : showBlanks ? (
        <Card className="p-5 text-center">
          <p className="text-sm text-text-secondary">No blanks for this sentence.</p>
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-surface">
              <svg className="h-8 w-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          <p className="text-text font-medium">Listen carefully...</p>
        </Card>
      )}

      {/* Next button */}
      {showBlanks && (
        <button
          onClick={handleNext}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover transition-all"
        >
          {isLast ? 'Finish' : 'Next Sentence'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/routes/PlayerPage.tsx
git commit -m "feat: rewrite PlayerPage for sentence-by-sentence cloze practice"
```

---

### Task 22: ReviewPage

**Files:**
- Create: `src/routes/ReviewPage.tsx`

- [ ] **Step 1: Create ReviewPage.tsx**

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGetReviewDetail } from '../lib/api';
import type { ReviewDetail } from '../types';
import OriginalTextPanel from '../components/OriginalTextPanel';
import AnswerPanel from '../components/AnswerPanel';
import Card from '../components/ui/Card';

export default function ReviewPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSentenceId, setActiveSentenceId] = useState<number | null>(null);

  useEffect(() => {
    if (!recordId) return;
    apiGetReviewDetail(Number(recordId))
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recordId]);

  const playSentence = useCallback((audioPath: string) => {
    const a = audioRef.current;
    if (!a || !audioPath) return;
    a.src = audioPath;
    a.load();
    a.play().catch(() => {});
  }, []);

  function handleSentenceClick(sentenceId: number) {
    setActiveSentenceId(sentenceId);
    const sentence = detail?.sentences.find(s => s.sentenceId === sentenceId);
    if (sentence?.audioPath) {
      playSentence(sentence.audioPath);
    }
  }

  function handleAudioEnded() {
    setActiveSentenceId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-text-secondary">Review not found.</p>
        <button onClick={() => navigate('/history')} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">
          Back to History
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/history')}
          className="rounded-lg p-1.5 text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text">{detail.lessonTitle}</h2>
          <div className="text-xs text-text-secondary">
            Score: {detail.score}% · {detail.completedAt}
          </div>
        </div>
      </div>

      {/* Score card */}
      <Card className={`flex items-center gap-5 p-5 ${
        detail.score >= 80 ? 'border-success/20' : detail.score >= 50 ? 'border-warning/20' : 'border-error/20'
      }`}>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
          detail.score >= 80 ? 'bg-success/10' : detail.score >= 50 ? 'bg-warning/10' : 'bg-error/10'
        }`}>
          <span className={`text-2xl font-extrabold ${
            detail.score >= 80 ? 'text-success' : detail.score >= 50 ? 'text-warning' : 'text-error'
          }`}>
            {detail.score}%
          </span>
        </div>
        <div>
          <div className={`text-lg font-bold ${
            detail.score >= 80 ? 'text-success' : detail.score >= 50 ? 'text-warning' : 'text-error'
          }`}>
            {detail.score >= 80 ? 'Great job!' : detail.score >= 50 ? 'Good effort!' : 'Keep trying!'}
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {detail.sentences.length} sentences · {detail.listenCount} plays
          </div>
        </div>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OriginalTextPanel
          sentences={detail.sentences}
          activeSentenceId={activeSentenceId}
          onSentenceClick={handleSentenceClick}
          audioRef={audioRef}
        />
        <AnswerPanel
          sentences={detail.sentences}
          activeSentenceId={activeSentenceId}
          onSentenceClick={handleSentenceClick}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:\listening-trainer
git add src/routes/ReviewPage.tsx
git commit -m "feat: add ReviewPage with two-column layout (original + answers)"
```

---

### Task 23: Update HomePage + RootLayout

**Files:**
- Modify: `src/routes/HomePage.tsx`
- Modify: `src/routes/RootLayout.tsx`

- [ ] **Step 1: Update HomePage.tsx**

Change the "Create Custom Lesson" button to point to `/lessons/new` and update navigation.

In `src/routes/HomePage.tsx`, change:

```typescript
// Line ~111-117: Update the custom lesson button
<button
  onClick={() => navigate('/lessons/new')}
  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-all"
>
  + Create Lesson
</button>
```

Also update the recent lessons section — the current code navigates to `/player/${lessonId}` which now uses numeric IDs. The existing code should work as long as `lessonId` is the new numeric lesson ID.

- [ ] **Step 2: Update RootLayout.tsx**

Add a "Lessons" link to the header nav:

```typescript
// In the header, after the History button:
<button
  onClick={() => navigate('/lessons')}
  className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text hover:bg-bg-alt transition-all"
>
  Lessons
</button>
```

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add src/routes/HomePage.tsx src/routes/RootLayout.tsx
git commit -m "feat: update HomePage and RootLayout for new lessons navigation"
```

---

### Task 24: Update ProgressContext + HistoryPage

**Files:**
- Modify: `src/context/ProgressContext.tsx`
- Modify: `src/routes/HistoryPage.tsx`

- [ ] **Step 1: Update ProgressContext.tsx**

The old context calls `apiGetProgress` which returns `ProgressData[]` with string `lessonId`. The new system uses numeric lesson IDs. Keep the existing progress API for backwards compatibility (it uses `user_progress` table which still exists).

No changes needed to `ProgressContext.tsx` — it still works with the existing `apiGetProgress` and `apiSaveProgress` endpoints.

- [ ] **Step 2: Update HistoryPage to show review link**

In `src/routes/HistoryPage.tsx`, update the history item click to navigate to the review page:

```typescript
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGetReviewDetail } from '../lib/api';
import type { ReviewDetail } from '../types';
import Card from '../components/ui/Card';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ReviewDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch history by getting practice records list first
    // For now, show the most recent records from the new practice_record table
    fetch('/api/progress/history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    })
      .then(r => r.json())
      .then(data => {
        // If data is new format (ReviewDetail array), use directly
        if (data.length > 0 && data[0].sentences) {
          setRecords(data);
        } else {
          // Old format: convert to minimal review detail
          setRecords(data.map((r: any) => ({
            recordId: r.id,
            lessonId: r.lessonId,
            lessonTitle: `Lesson ${r.lessonId}`,
            score: r.score,
            listenCount: 0,
            completedAt: r.date,
            sentences: [],
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-text tracking-tight">Practice History</h2>

      {records.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-sm text-text-secondary">No practice records yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((row, idx) => (
            <button
              key={row.recordId}
              onClick={() => navigate(`/history/${row.recordId}/review`)}
              className="flex items-center gap-4 w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:-translate-y-[1px] hover:shadow-md transition-all animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text">
                  {row.lessonTitle}
                </div>
                <div className="text-xs text-text-secondary">{row.completedAt}</div>
              </div>
              <div className={`text-lg font-bold ${
                row.score >= 80 ? 'text-success' : row.score >= 50 ? 'text-warning' : 'text-error'
              }`}>
                {row.score}%
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

Note: `apiGetHistory` currently returns `HistoryRow[]` with `{id, lessonId, score, date}`. For the new system, we may want to update the backend to return lesson title as well, but for now this works.

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add src/routes/HistoryPage.tsx
git commit -m "feat: update HistoryPage to navigate to new review page"
```

---

## Phase 7: Cleanup + Audio Static Serving

### Task 25: Configure Audio Serving + Vite

**Files:**
- Create: `public/.gitkeep` (audio directory placeholder)
- Modify: `vite.config.ts` (if needed for static file serving)

- [ ] **Step 1: Create audio directory placeholder**

```bash
mkdir -p D:\listening-trainer\public\audio\lessons
```

Add `public/audio/.gitkeep` to keep the directory in git.

- [ ] **Step 2: Verify Vercel serves static audio**

The `public/` directory is automatically served by Vite in dev and Vercel in production. Audio files at `/audio/lessons/{lessonId}/{index}.mp3` will be accessible.

For production deployment, audio files need to be uploaded to Vercel blob or S3. For now, local file storage works for Docker deployment.

- [ ] **Step 3: Commit**

```bash
cd D:\listening-trainer
git add public/audio/.gitkeep
git commit -m "chore: add audio directory placeholder"
```

---

### Task 26: Delete Obsolete Files

**Files:**
- Delete: `src/data/lessons.ts` (built-in single-sentence lessons no longer needed, or keep for backwards compat)
- Delete: `src/utils/customLessons.ts` (replaced by new lesson API)
- Delete: `src/routes/CustomLessonPage.tsx` (replaced by LessonCreatePage)
- Delete: `src/components/Player.tsx` (replaced by new PlayerPage)
- Delete: `backend/src/main/java/com/listeningtrainer/controller/CustomLessonController.java`
- Delete: `backend/src/main/java/com/listeningtrainer/service/CustomLessonService.java`
- Delete: `backend/src/main/java/com/listeningtrainer/entity/CustomLesson.java`
- Delete: `backend/src/main/java/com/listeningtrainer/mapper/CustomLessonMapper.java`
- Delete: `backend/src/main/java/com/listeningtrainer/dto/CustomLessonRequest.java`
- Delete: `backend/src/main/java/com/listeningtrainer/dto/CustomLessonResponse.java`

- [ ] **Step 1: Decide what to keep**

- Keep `src/data/lessons.ts` for backwards compatibility with existing lesson IDs (daily-01 etc.)
- Delete `src/routes/CustomLessonPage.tsx` — replaced by LessonCreatePage
- Delete `src/utils/customLessons.ts` — replaced by new API
- Delete `src/components/Player.tsx` — replaced by new PlayerPage inline
- Delete backend custom lesson files — replaced by new LessonController

- [ ] **Step 2: Update router to remove CustomLessonPage route**

In `src/lib/router.tsx`, remove the `/custom` route.

- [ ] **Step 3: Delete files and commit**

```bash
cd D:\listening-trainer
git rm src/routes/CustomLessonPage.tsx \
  src/utils/customLessons.ts \
  src/components/Player.tsx \
  backend/src/main/java/com/listeningtrainer/controller/CustomLessonController.java \
  backend/src/main/java/com/listeningtrainer/service/CustomLessonService.java \
  backend/src/main/java/com/listeningtrainer/entity/CustomLesson.java \
  backend/src/main/java/com/listeningtrainer/mapper/CustomLessonMapper.java \
  backend/src/main/java/com/listeningtrainer/dto/CustomLessonRequest.java \
  backend/src/main/java/com/listeningtrainer/dto/CustomLessonResponse.java

git commit -m "chore: remove obsolete custom lesson files and old Player component"
```

---

## Summary of Phases

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | Task 1-3 | Database schema + entities + mappers |
| 2 | Task 4 | CoreNLP sentence splitting + cloze generation |
| 3 | Task 5-11 | DTOs, services, controllers, API endpoints |
| 4 | Task 12-13 | Frontend types + API layer |
| 5 | Task 14-17 | Reusable UI components |
| 6 | Task 18-24 | Pages, routing, integration |
| 7 | Task 25-26 | Audio serving, cleanup |

Each phase produces independently testable, commitable changes.
