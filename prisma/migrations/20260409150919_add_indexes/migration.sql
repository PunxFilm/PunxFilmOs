-- CreateIndex
CREATE INDEX "Festival_deadlineGeneral_idx" ON "Festival"("deadlineGeneral");

-- CreateIndex
CREATE INDEX "Festival_category_idx" ON "Festival"("category");

-- CreateIndex
CREATE INDEX "Film_status_idx" ON "Film"("status");

-- CreateIndex
CREATE INDEX "FinanceEntry_date_idx" ON "FinanceEntry"("date");

-- CreateIndex
CREATE INDEX "FinanceEntry_type_idx" ON "FinanceEntry"("type");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_filmId_idx" ON "Submission"("filmId");

-- CreateIndex
CREATE INDEX "Submission_festivalId_idx" ON "Submission"("festivalId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Task_filmId_idx" ON "Task"("filmId");
