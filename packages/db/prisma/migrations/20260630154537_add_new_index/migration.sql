-- CreateIndex
CREATE INDEX "activity_logs_schoolId_createdAt_idx" ON "activity_logs"("schoolId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_referenceType_referenceId_idx" ON "activity_logs"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "activity_logs_actionType_idx" ON "activity_logs"("actionType");

-- CreateIndex
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "class_students_studentId_idx" ON "class_students"("studentId");

-- CreateIndex
CREATE INDEX "class_students_classId_idx" ON "class_students"("classId");

-- CreateIndex
CREATE INDEX "class_subjects_teacherId_idx" ON "class_subjects"("teacherId");

-- CreateIndex
CREATE INDEX "class_subjects_subjectId_idx" ON "class_subjects"("subjectId");

-- CreateIndex
CREATE INDEX "grade_entries_classSubjectId_semesterId_idx" ON "grade_entries"("classSubjectId", "semesterId");

-- CreateIndex
CREATE INDEX "grade_entries_semesterId_idx" ON "grade_entries"("semesterId");

-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");

-- CreateIndex
CREATE INDEX "grades_createdById_idx" ON "grades"("createdById");
