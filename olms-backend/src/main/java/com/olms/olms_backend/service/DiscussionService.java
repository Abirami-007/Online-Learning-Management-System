package com.olms.olms_backend.service;

import com.olms.olms_backend.entity.Discussion;

import java.util.List;

public interface DiscussionService {

    Discussion createDiscussion(Discussion discussion);

    List<Discussion> getAllDiscussions();

    Discussion getDiscussionById(Long id);

    Discussion updateDiscussion(Long id, Discussion discussion);

    void deleteDiscussion(Long id);
}