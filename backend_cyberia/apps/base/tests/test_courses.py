from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.base.models import Course


class CourseApiTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('base:courses_api')

    def test_frontend_multipart_payload_creates_course(self):
        response = self.client.post(
            self.list_url,
            {
                'title': 'Django REST Framework',
                'instructor': 'Example Instructor',
                'platform': 'Udemy',
                'status': 'IP',
                'number_of_lessons': '40',
                'completed_lessons': '8',
                'goal_date': '2026-12-01',
                'certificate_available': 'true',
                'modules': '["Serializers", "ViewSets"]',
                'sources': '[{"format":"WEB","location":null,"url":"https://example.com/course"}]',
            },
            format='multipart',
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        course = Course.objects.get()
        assert course.modules == ['Serializers', 'ViewSets']
        assert course.certificate_available
        assert course.sources.get().url == 'https://example.com/course'

    def test_detail_panel_fields_can_be_patched_without_losing_course_data(self):
        completed_lessons = 4
        course = Course.objects.create(
            title='Python course',
            status='IP',
            number_of_lessons=20,
            completed_lessons=completed_lessons,
        )

        response = self.client.patch(
            reverse('base:course_api', args=[course.pk]),
            {'goal_date': '2026-11-30', 'certificate_available': True},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK, response.data
        course.refresh_from_db()
        assert course.goal_date.isoformat() == '2026-11-30'
        assert course.certificate_available
        assert course.title == 'Python course'
        assert course.completed_lessons == completed_lessons

    def test_completed_lessons_cannot_exceed_total(self):
        course = Course.objects.create(title='Course', number_of_lessons=10)

        response = self.client.patch(
            reverse('base:course_api', args=[course.pk]),
            {'completed_lessons': 11},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        course.refresh_from_db()
        assert course.completed_lessons == 0

    def test_patch_without_goal_date_preserves_existing_date(self):
        course = Course.objects.create(title='Course', goal_date='2026-11-30')
        response = self.client.patch(reverse('base:course_api', args=[course.pk]), {'title': 'Updated'}, format='json')
        assert response.status_code == status.HTTP_200_OK, response.data
        course.refresh_from_db()
        assert course.goal_date.isoformat() == '2026-11-30'

    def test_patch_with_empty_goal_date_clears_existing_date(self):
        course = Course.objects.create(title='Course', goal_date='2026-11-30')
        response = self.client.patch(reverse('base:course_api', args=[course.pk]), {'goal_date': ''}, format='json')
        assert response.status_code == status.HTTP_200_OK, response.data
        course.refresh_from_db()
        assert course.goal_date is None
